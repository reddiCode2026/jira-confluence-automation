from datetime import date

import pytest

from generate_status_report import (
    Config,
    ConfigurationError,
    Issue,
    JiraApiError,
    JiraClient,
    calculate_metrics,
    generate_report,
    rag_status,
    render_report,
    rolling_range,
)


def issue(key: str, category: str, points: float | None = 1, flagged: bool = False) -> Issue:
    return Issue(key, f"Summary {key}", "Task", "In Progress", category, points, flagged=flagged)


def test_rolling_range_includes_run_date_and_six_prior_days() -> None:
    assert rolling_range(date(2026, 1, 2)) == (date(2025, 12, 27), date(2026, 1, 2))


def test_metrics_exclude_unestimated_issues_from_point_totals() -> None:
    metrics = calculate_metrics([issue("PROJ-1", "done", 3), issue("PROJ-2", "new", None)])
    assert metrics.completed_points == 3
    assert metrics.total_points == 3
    assert metrics.percent_complete == 100


def test_blocker_forces_red() -> None:
    metrics = calculate_metrics([issue("PROJ-1", "done", 1)])
    assert rag_status([issue("PROJ-2", "indeterminate", 2, flagged=True)], metrics)[0] == "Red"


def test_report_renders_empty_placeholders() -> None:
    metrics = calculate_metrics([])
    report = render_report("PROJ", date(2026, 9, 2), date(2026, 9, 8), date(2026, 9, 8), [], [], [], metrics)
    assert "## Completed This Week\nNone" in report
    assert "## In-Progress / At-Risk Items\nNone" in report
    assert "No blockers reported." in report


def test_config_rejects_missing_values(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JIRA_SITE_URL", raising=False)
    monkeypatch.delenv("JIRA_EMAIL", raising=False)
    monkeypatch.delenv("JIRA_API_TOKEN", raising=False)
    monkeypatch.delenv("JIRA_PROJECT_KEY", raising=False)

    with pytest.raises(ConfigurationError, match="JIRA_SITE_URL"):
        Config.from_environment()


def test_config_normalizes_site_url_and_project_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JIRA_SITE_URL", "https://jira.example/")
    monkeypatch.setenv("JIRA_EMAIL", "pm@example.com")
    monkeypatch.setenv("JIRA_API_TOKEN", "token")
    monkeypatch.setenv("JIRA_PROJECT_KEY", "proj")

    config = Config.from_environment()

    assert config.site_url == "https://jira.example"
    assert config.project_key == "PROJ"


class FakeResponse:
    def __init__(self, payload: dict, status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code
        self.ok = status_code < 400
        self.text = "response body"

    def json(self) -> dict:
        return self._payload


class FakeSession:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self.responses = responses
        self.calls: list[dict] = []
        self.auth = None
        self.headers: dict[str, str] = {}

    def get(self, url: str, **kwargs: object) -> FakeResponse:
        self.calls.append({"url": url, **kwargs})
        return self.responses.pop(0)


def test_search_consumes_all_pages_and_normalizes_issues() -> None:
    config = Config("https://jira.example", "pm@example.com", "token", "PROJ")
    session = FakeSession([
        FakeResponse({"total": 2, "issues": [{"key": "PROJ-1", "fields": {"summary": "One"}}]}),
        FakeResponse({"total": 2, "issues": [{"key": "PROJ-2", "fields": {"summary": "Two"}}]}),
    ])

    issues = JiraClient(config, session).search("project = PROJ", ("summary",))

    assert [item.key for item in issues] == ["PROJ-1", "PROJ-2"]
    assert [call["params"]["startAt"] for call in session.calls] == [0, 1]


def test_search_raises_for_api_failure() -> None:
    config = Config("https://jira.example", "pm@example.com", "token", "PROJ")
    session = FakeSession([FakeResponse({}, 401)])

    with pytest.raises(JiraApiError, match="401"):
        JiraClient(config, session).search("project = PROJ", ("summary",))


def test_report_uses_project_key_and_does_not_write_after_api_failure(tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    config = Config("https://jira.example", "pm@example.com", "token", "PROJ")
    session = FakeSession([FakeResponse({}, 500)])
    monkeypatch.setattr("generate_status_report.REPORTS_DIR", tmp_path)

    with pytest.raises(JiraApiError):
        generate_report(JiraClient(config, session), config, date(2026, 9, 8))

    assert list(tmp_path.iterdir()) == []
    assert session.calls[0]["params"]["jql"] == "project = PROJ AND statusCategory = Done AND resolved >= -7d"