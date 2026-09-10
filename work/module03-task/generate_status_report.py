"""Generate a rolling seven-day Jira status report in Markdown."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Iterable, Mapping

import requests
from dotenv import load_dotenv


ROLLING_WINDOW_DAYS = 7
EXPECTED_PACE_THRESHOLD = 0.70
PROJECT_KEY_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{1,9}$")
REPORTS_DIR = Path(__file__).parent / "reports"


class ConfigurationError(ValueError):
    """Raised when required Jira configuration is missing or invalid."""


class JiraApiError(RuntimeError):
    """Raised when Jira returns an unusable response."""


@dataclass(frozen=True)
class Config:
    site_url: str
    email: str
    api_token: str
    project_key: str

    @classmethod
    def from_environment(cls) -> "Config":
        load_dotenv()
        values = {name: os.getenv(name, "").strip() for name in (
            "JIRA_SITE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY"
        )}
        missing = [name for name, value in values.items() if not value]
        if missing:
            raise ConfigurationError(
                "Missing required configuration: " + ", ".join(missing) +
                ". Add these values to your local .env file."
            )
        project_key = values["JIRA_PROJECT_KEY"].upper()
        if not PROJECT_KEY_PATTERN.fullmatch(project_key):
            raise ConfigurationError(
                "JIRA_PROJECT_KEY must start with a letter and contain only "
                "letters, numbers, or underscores (2-10 characters)."
            )
        return cls(values["JIRA_SITE_URL"].rstrip("/"), values["JIRA_EMAIL"], values["JIRA_API_TOKEN"], project_key)


@dataclass(frozen=True)
class Issue:
    key: str
    summary: str
    issue_type: str
    status: str
    status_category: str
    story_points: float | None
    labels: tuple[str, ...] = ()
    flagged: bool = False
    blocked_since: datetime | None = None


@dataclass(frozen=True)
class Metrics:
    completed_points: float
    total_points: float
    percent_complete: float
    todo_count: int
    in_progress_count: int
    done_count: int


def rolling_range(run_date: date) -> tuple[date, date]:
    return run_date - timedelta(days=ROLLING_WINDOW_DAYS - 1), run_date


def _story_points(fields: Mapping[str, Any]) -> float | None:
    for name in ("story points", "storyPoints", "customfield_10016", "customfield_10026"):
        value = fields.get(name)
        if value is not None:
            try:
                return float(value)
            except (TypeError, ValueError):
                return None
    return None


def normalize_issue(raw: Mapping[str, Any]) -> Issue:
    fields = raw.get("fields") or {}
    issue_type = fields.get("issuetype") or {}
    status = fields.get("status") or {}
    status_category = status.get("statusCategory") or {}
    flagged = fields.get("flagged") in (True, {"value": "Impediment"})
    labels = tuple(str(label) for label in (fields.get("labels") or ()))
    return Issue(
        key=str(raw.get("key", "")), summary=str(fields.get("summary") or "(no summary)"),
        issue_type=str(issue_type.get("name") or "Unknown"), status=str(status.get("name") or "Unknown"),
        status_category=str(status_category.get("key") or status_category.get("name") or "").lower(),
        story_points=_story_points(fields), labels=labels, flagged=flagged,
    )


class JiraClient:
    """Small Jira search client; the session can be replaced in tests."""

    def __init__(self, config: Config, session: requests.Session | None = None) -> None:
        self.base_url = f"{config.site_url}/rest/api/3"
        self.session = session or requests.Session()
        self.session.auth = (config.email, config.api_token)
        self.session.headers.update({"Accept": "application/json"})

    def search(self, jql: str, fields: Iterable[str]) -> list[Issue]:
        results: list[Issue] = []
        start_at = 0
        while True:
            response = self.session.get(
                f"{self.base_url}/search",
                params={"jql": jql, "startAt": start_at, "maxResults": 100, "fields": ",".join(fields)},
                timeout=30,
            )
            if not response.ok:
                raise JiraApiError(f"Jira API request failed ({response.status_code}): {response.text[:200]}")
            try:
                payload = response.json()
                issues = payload["issues"]
                total = int(payload["total"])
            except (ValueError, KeyError, TypeError) as error:
                raise JiraApiError("Jira returned a malformed search response.") from error
            if not isinstance(issues, list):
                raise JiraApiError("Jira returned an invalid issues collection.")
            results.extend(normalize_issue(issue) for issue in issues)
            start_at += len(issues)
            if not issues or start_at >= total:
                return results


def calculate_metrics(issues: Iterable[Issue]) -> Metrics:
    issue_list = list(issues)
    completed_points = sum(issue.story_points or 0 for issue in issue_list if issue.status_category == "done")
    total_points = sum(issue.story_points or 0 for issue in issue_list)
    percent = (completed_points / total_points * 100) if total_points else 0.0
    return Metrics(completed_points, total_points, percent,
                   sum(issue.status_category == "new" for issue in issue_list),
                   sum(issue.status_category == "indeterminate" for issue in issue_list),
                   sum(issue.status_category == "done" for issue in issue_list))


def rag_status(blockers: Iterable[Issue], metrics: Metrics) -> tuple[str, str]:
    blocker_list = list(blockers)
    if blocker_list:
        return "Red", f"{len(blocker_list)} blocked issue(s) require attention."
    if metrics.total_points == 0:
        return "Amber", "No estimated story points are available to measure completion."
    if metrics.percent_complete < EXPECTED_PACE_THRESHOLD * 100:
        return "Amber", f"Completion is {metrics.percent_complete:.0f}%, below the 70% expected pace."
    return "Green", f"Completion is {metrics.percent_complete:.0f}%, meeting the 70% expected pace."


def _safe(text: str) -> str:
    return text.replace("\\", "\\\\").replace("|", "\\|").replace("[", "\\[").replace("]", "\\]")


def _points(value: float | None) -> str:
    return "unestimated" if value is None else (str(int(value)) if value.is_integer() else str(value))


def _week_label(start: date, end: date) -> str:
    start_text = start.strftime("%b %d").replace(" 0", " ")
    end_text = end.strftime("%d, %Y").lstrip("0")
    return f"{start_text}-{end_text}"


def render_report(project_key: str, start: date, end: date, generated: date,
                  completed: list[Issue], in_progress: list[Issue], blockers: list[Issue],
                  metrics: Metrics) -> str:
    status, rationale = rag_status(blockers, metrics)
    completed_lines = [f"- **{_safe(i.key)}** {_safe(i.summary)} ({_safe(i.issue_type)})" for i in completed]
    progress_lines = [f"- **{_safe(i.key)}** {_safe(i.summary)} - {i.status}; {_points(i.story_points)} points" for i in in_progress]
    blocker_lines = [f"- **{_safe(i.key)}** {_safe(i.summary)} - duration: unknown" for i in blockers]
    return "\n".join([
        f"# Weekly Status Report - {project_key}",
        f"**Week of:** {_week_label(start, end)}  ",
        f"**Generated:** {generated.isoformat()}", "", "## Overall Health", f"**{status}** - {rationale}", "",
        "## Completed This Week", *(completed_lines or ["None"]), "",
        "## In-Progress / At-Risk Items", *(progress_lines or ["None"]), "",
        "## Blockers / Impediments", *(blocker_lines or ["No blockers reported."]), "", "## Metrics Summary",
        f"- Story points completed: {_points(metrics.completed_points)} / {_points(metrics.total_points)}",
        f"- Completion: {metrics.percent_complete:.0f}%",
        f"- Status counts: To Do {metrics.todo_count}, In Progress {metrics.in_progress_count}, Done {metrics.done_count}", "",
    ])


def generate_report(client: JiraClient, config: Config, run_date: date | None = None) -> Path:
    run_date = run_date or date.today()
    start, end = rolling_range(run_date)
    fields = ("summary", "issuetype", "status", "labels", "flagged", "customfield_10016")
    completed = client.search(f"project = {config.project_key} AND statusCategory = Done AND resolved >= -7d", fields)
    in_progress = client.search(f'project = {config.project_key} AND statusCategory = "In Progress"', fields)
    blockers = client.search(f'project = {config.project_key} AND (flagged = Impediment OR labels = "blocked") AND statusCategory != Done', fields)
    scope = client.search(f"project = {config.project_key} AND (statusCategory != Done OR resolved >= -7d)", fields)
    report = render_report(config.project_key, start, end, run_date, completed, in_progress, blockers, calculate_metrics(scope))
    REPORTS_DIR.mkdir(exist_ok=True)
    output = REPORTS_DIR / f"status_report_{run_date.isoformat()}.md"
    output.write_text(report, encoding="utf-8")
    return output


def main() -> int:
    try:
        config = Config.from_environment()
        output = generate_report(JiraClient(config), config)
    except (ConfigurationError, JiraApiError, requests.RequestException) as error:
        print(f"Error: {error}")
        return 1
    print(f"Report written to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())