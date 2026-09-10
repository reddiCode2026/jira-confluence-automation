# Weekly Status Report Generator

Generates a dated Markdown status report for one Jira Cloud project using a rolling
seven-day window. The report is written to `reports/status_report_<YYYY-MM-DD>.md`.

## Requirements

- Python 3.10 or newer
- Jira Cloud credentials with permission to search the project

Install dependencies from this directory:

```bash
python -m pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and set:

```text
JIRA_SITE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJ
```

The local `.env` is ignored by Git. Never commit credentials or place them in a
generated report.

## Generate a report

Run manually from this directory:

```bash
python generate_status_report.py
```

`main.py` remains available as a compatibility entry point. A failed configuration
or Jira request exits nonzero and does not write a report.

## Report behavior

The report includes completed issues, in-progress issues, blockers, overall RAG
health, and status/point metrics. It queries one project with these scopes:

- Completed: issues resolved in the last seven days.
- In progress: all issues currently in the In Progress status category.
- Blockers: flagged impediments or issues labeled `blocked`, excluding Done issues.
- Metrics: open issues plus issues resolved in the same rolling window.

Missing estimates are excluded from point totals and displayed as `unestimated`.
The default Green threshold is 70% completion; blockers always produce Red, and a
zero-point scope produces Amber because completion cannot be measured. Blocker age
is currently shown as `unknown` because changelog lookup is not yet implemented.

## Tests

Run the suite from this directory:

```bash
python -m pytest
python -m py_compile generate_status_report.py main.py
```

Tests use fake Jira responses and do not require live credentials.

## v1 exclusions

The generator does not send email or Slack messages, schedule runs, aggregate
multiple projects, show per-assignee workload, render charts, compare historical
trends, or include a manual Next Sprint Goals section.
