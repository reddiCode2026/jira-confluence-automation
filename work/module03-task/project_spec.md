# Weekly Status Report Generator — Technical Specification

## 1. Purpose
Generate a stakeholder-facing weekly status report summarizing the past week's Jira
activity for a single project/team, so the Project Manager (managing a 10-person
Agile Scrum team) can quickly produce and share a consistent, professional status
update without manually compiling ticket data.

## 2. Audience & Output Format
- **Audience:** External/upward stakeholders (not the dev team itself).
- **Format:** A single Markdown (`.md`) file, generated locally and shared manually
  (e.g., pasted into email, Confluence, or Slack) by the PM.
- No automated email/Slack delivery in v1.

## 3. Scope & Time Window
- **Rolling 7-day window**: covers all qualifying issue activity in the last 7 days,
  independent of Jira sprint boundaries (not tied to "current sprint" only).
- **Single Jira project key** (e.g., `PROJ`) per run — no multi-project aggregation.
- Team/sprint-level aggregate only — **no per-assignee breakdown** in v1.

## 4. Data Source
- **Jira Cloud REST API** (`/rest/api/3/search` with JQL), authenticated via API
  token (email + `JIRA_API_TOKEN`), consistent with the existing `jira-dashboard`
  project's auth pattern.
- Credentials are reused/stored in this project's own `.env` (see §9).

### JQL query strategy
- **Completed this week:**
  `project = {PROJECT_KEY} AND statusCategory = Done AND resolved >= -7d`
- **In-progress / at-risk:**
  `project = {PROJECT_KEY} AND statusCategory = "In Progress"`
- **Blocked:**
  `project = {PROJECT_KEY} AND (flagged = Impediment OR labels = "blocked") AND statusCategory != Done`

## 5. Report Content Sections
The generated Markdown report includes, in order:

1. **Header** — Project name/key, week date range (e.g., `Week of Sep 1–7, 2026`),
   generated-by/date stamp.
2. **Overall Health (RAG Status)** — Red / Amber / Green indicator with a one-line
   auto-generated rationale (see §6).
3. **Completed This Week** — Bullet list of issues resolved in the last 7 days:
   issue key, summary, issue type.
4. **In-Progress / At-Risk Items** — Bullet list of open issues currently in
   progress: issue key, summary, status, story points/estimate.
5. **Blockers / Impediments** — Bullet list of flagged/labeled blocked issues:
   issue key, summary, how long it's been blocked (days since flagged, if
   derivable from Jira changelog/flagged timestamp). If none, display
   "No blockers reported."
6. **Metrics Summary**
   - Story points completed this week vs. total committed (from JQL results)
   - % complete (completed points / total points in scope)
   - Status counts (To Do / In Progress / Done)

**Not included (explicitly out of scope for v1):** per-assignee workload
breakdown, "Next Sprint Goals" (manual/freeform section), burndown chart,
week-over-week trend comparison.

## 6. RAG Status Logic (auto-computed)
Deterministic rule-based calculation (no manual override in v1):

| Condition | Status |
|---|---|
| Any blocked/flagged issue exists | 🔴 **Red** |
| No blockers, and % complete for the week < 70% of expected pace* | 🟡 **Amber** |
| No blockers, and % complete ≥ 70% of expected pace* | 🟢 **Green** |

\* "Expected pace" = completed story points this week ÷ total open+completed
story points in the project scope. Exact threshold (70%) is a v1 default and
should be configurable via a constant/env var for easy tuning.

## 7. Blocker/Risk Detection
- Primary signal: Jira **"Flagged"** field (`flagged = Impediment`).
- Secondary signal: issues with label `blocked`.
- An issue matching either signal (and not in a Done status) is listed under
  Blockers and forces overall status to Red.

## 8. Execution Model
- **Manual run**: PM executes `python generate_status_report.py` when ready
  (e.g., weekly, before a stakeholder update).
- Script fetches live data from Jira at run time and writes a new report file
  (does not overwrite prior weeks — see §10 naming).
- No scheduling/automation in v1 (may be added later via Task Scheduler/cron).

## 9. Configuration / Credentials
Reuses the same environment variable pattern as `jira-dashboard`, stored in this
project's local `.env` (already gitignored via existing `.gitignore` rules for
`.env` / `.env.*`):

- `JIRA_SITE_URL` — 'https://jiraeu.epam.com/' 
- `JIRA_EMAIL` — Atlassian account email used with the API token
- `JIRA_API_TOKEN` — Jira API token (already present in local `.env`)
- `JIRA_PROJECT_KEY` — 'EPMCDMETST'

A `.env.example` with placeholder values should be added for onboarding;
real `.env` values are never committed.

## 10. Output File Location & Naming
- Reports are written to a `reports/` subfolder within this project
  (`work/module03-task/reports/`).
- Filename convention: `status_report_<YYYY-MM-DD>.md`, where the date is the
  report generation date (so each weekly run produces a new, dated file and
  history is preserved).

## 11. Error Handling
- If Jira API auth fails or returns a non-2xx response, the script prints a
  clear error message and exits without writing a partial report file.
- If a JQL query returns zero results for a section (e.g., no blockers), the
  report renders an explicit "None" placeholder rather than omitting the
  section.

## 12. Out of Scope (v1)
- Automated email/Slack/Teams delivery
- Multi-project aggregation
- Per-assignee workload breakdown
- Manual "Next Sprint Goals" freeform section
- Burndown/velocity charts (graphical)
- Week-over-week historical trend comparison
- Scheduled/automated runs

## 13. Future Enhancements (post-v1, not committed)
- Configurable RAG thresholds via `.env`
- Optional per-assignee breakdown flag
- Historical report diffing for trend indicators
- Direct posting to Confluence or Slack
