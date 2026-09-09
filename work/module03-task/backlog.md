# Weekly Status Report Generator Backlog

## Planning Decisions

- MVP-first priority: deliver a working end-to-end report before hardening and polish.
- Phases may overlap when dependencies permit; keep the end-to-end happy path visible throughout implementation.
- Initial metrics denominator: all open and recently completed project issues in scope for the report.
- If Jira cannot provide a flagged timestamp, render the blocker duration as `unknown`.
- v1 remains manual, single-project, rolling 7-day, Markdown-only, and local-file based.

## Decisions Made

- **Language and entry point:** Use Python with `generate_status_report.py` as the primary manual entry point; retain `main.py` as a compatibility wrapper.
- **Dependencies:** Use `requests` for Jira Cloud HTTP calls, `python-dotenv` for local configuration, and `pytest` for automated tests.
- **Authentication:** Use Jira email plus API token through `requests` basic authentication; keep credentials in a gitignored local `.env` file.
- **Configuration boundary:** Validate `JIRA_SITE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `JIRA_PROJECT_KEY` before constructing a client or making an API request.
- **Domain architecture:** Normalize raw Jira payloads into typed `Issue` and `Metrics` dataclasses so calculations and rendering do not depend on API response shapes.
- **API boundary:** Centralize paginated `/rest/api/3/search` handling, requested fields, response validation, and error conversion in `JiraClient.search`.
- **Report architecture:** Keep metrics/RAG calculation separate from Markdown rendering, then write the report only after all Jira calls and rendering succeed.
- **Output format:** Generate local Markdown files under `reports/status_report_<YYYY-MM-DD>.md`; preserve prior dated reports and provide explicit empty-section placeholders.
- **Testing strategy:** Use `pytest` with injectable Jira clients/sessions and fake responses so unit and integration-style tests never require live Jira credentials.
- **Scope:** Keep v1 manual, single-project, rolling 7-day, aggregate-only, and Markdown-only; defer delivery integrations, scheduling, charts, and per-assignee views.

## Setup

- [x] Review the existing `module03-task` calculator scaffold and define the replacement module layout without changing unrelated workspace files.
- [x] Add a dependency manifest or installation instructions for the Jira HTTP client, environment loader, and test tooling selected for the implementation.
- [x] Add `.env.example` with placeholder values for `JIRA_SITE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `JIRA_PROJECT_KEY`.
- [x] Confirm `.gitignore` excludes `.env` and `.env.*`, and verify that no real credentials are tracked.
- [x] Create the `reports/` output directory and keep generated dated reports separate from source code.
- [x] Define shared configuration constants for the rolling window, RAG expected-pace threshold (default `70%`), and project key.
- [x] Establish a test layout for unit tests, API/client tests, report rendering tests, and end-to-end tests. GitHub issue #1.
- [x] Add a small fixture dataset representing completed, in-progress, blocked, unestimated, and empty-result Jira issues.

## Core Features

### Configuration and CLI

- [x] Implement environment loading and validation for the four required Jira settings.
- [x] Implement the manual entry point `generate_status_report.py` so `python generate_status_report.py` runs one report generation.
- [x] Fail before any API request when required configuration is missing, with a clear actionable message.
- [x] Normalize the Jira site URL and construct the Jira Cloud REST API base URL consistently.
- [x] Calculate the rolling 7-day date range from the run date and use it in queries and report headings.

### Jira Data Access

- [x] Implement authenticated Jira Cloud REST API access using email plus API token.
- [x] Add a reusable search helper for `/rest/api/3/search` with JQL, pagination, requested fields, and response validation. User MCP for this task
- [x] Implement the completed-items JQL using `statusCategory = Done AND resolved >= -7d`. Use MCP for this task.
- [x] Implement the in-progress/at-risk JQL using `statusCategory = "In Progress"`. Use MCP for this task.
- [x] Implement the blocker JQL using the flagged impediment or `blocked` label signals, excluding Done issues. Use MCP for this task.
- [x] Request only the fields required for issue keys, summaries, issue types, statuses, story points/estimates, labels, flags, and timestamps.
- [x] Normalize Jira responses into internal issue records so report logic does not depend on raw API payloads.
- [x] Handle pagination so large projects do not silently produce incomplete sections.
- [x] Add safe extraction for missing, null, or differently named story-point fields.
- [ ] Add a changelog/timestamp lookup only when available for deriving blocker age; otherwise preserve `unknown` duration.

### Metrics and RAG Logic

- [x] Define the project-scope issue set used for metrics as open plus recently completed issues for the configured project.
- [x] Calculate completed story points, total in-scope story points, percentage complete, and To Do/In Progress/Done counts.
- [x] Define how missing story-point estimates are excluded from point totals and represented in the report.
- [x] Calculate RAG status deterministically: any blocker is Red; otherwise below the configurable 70% threshold is Amber; otherwise Green.
- [x] Generate a one-line rationale that names the controlling condition, including blocker presence or completion percentage.
- [x] Ensure zero-point and empty-result cases do not cause division-by-zero or misleading percentages.

### Markdown Report Generation

- [x] Render the header with project name/key, rolling week date range, and generation date.
- [x] Render the Overall Health section with the computed Red/Amber/Green indicator and rationale.
- [x] Render Completed This Week with issue key, summary, and issue type, or an explicit `None` placeholder.
- [x] Render In-Progress / At-Risk Items with key, summary, status, and story points/estimate, or `None`.
- [x] Render Blockers / Impediments with key, summary, and blocker duration; use `unknown` when duration is unavailable, or `No blockers reported.` when empty.
- [x] Render Metrics Summary with points completed versus total in scope, percentage complete, and status counts.
- [x] Preserve the required section order and produce valid readable Markdown.
- [x] Write only after all Jira calls, calculations, and rendering succeed.
- [x] Save each report to `reports/status_report_<YYYY-MM-DD>.md` without overwriting prior dates.

## Integration

- [x] Connect configuration loading, Jira client calls, issue normalization, metrics/RAG calculation, Markdown rendering, and dated file writing through the CLI entry point.
- [ ] Verify the API request uses the configured project key and rolling 7-day window rather than a hard-coded project or sprint.
- [ ] Verify all three report queries use the expected JQL and that results are mapped to the correct sections.
- [ ] Verify the metric issue set and section issue sets are combined without duplicate counting.
- [x] Add a dry-run or injected-client path for integration tests so tests do not require live Jira credentials.
- [ ] Run one authorized local report against Jira using a real `.env` without exposing credentials in logs or generated output.
- [ ] Confirm successful output appears in `reports/` and a second run on a different date preserves the earlier report.
- [ ] Confirm API failures, authentication failures, malformed responses, and missing configuration exit nonzero and create no partial report.

## Testing

### Unit Tests

- [ ] Test environment validation for complete, missing, and malformed configuration.
- [ ] Test rolling date-range and dated filename generation around month/year boundaries.
- [ ] Test JQL construction with a normal project key and reject unsafe/invalid project-key input as appropriate.
- [ ] Test Jira response normalization with complete fields, missing estimates, null values, and unexpected status data.
- [ ] Test metrics for normal estimates, zero totals, missing estimates, no issues, and mixed status categories.
- [ ] Test RAG rules for blockers, below-threshold completion, exactly-threshold completion, and above-threshold completion.
- [ ] Test blocker duration formatting for a derivable timestamp and `unknown` fallback.
- [x] Test each Markdown section for populated and empty results, including required placeholders.
- [ ] Test that report rendering escapes or safely formats issue text that contains Markdown-sensitive characters.

### API and Integration Tests

- [x] Mock successful paginated Jira search responses and verify all pages are consumed.
- [x] Mock non-2xx responses and authentication failures and verify clear errors with no output file.
- [ ] Mock malformed or incomplete API payloads and verify controlled handling.
- [ ] Run an end-to-end test with fixture responses and assert the complete report structure, RAG status, metrics, and output path.
- [x] Run the test suite from the project directory using the documented command. GitHub issue #2.

## Documentation

- [x] Replace the calculator-focused README content with setup, configuration, and usage instructions for the status report generator.
- [x] Document Python version, dependency installation, `.env` setup, and the manual execution command.
- [x] Document the rolling 7-day scope, single-project limitation, query behavior, and generated report naming.
- [x] Document the metrics denominator decision, treatment of missing estimates, and 70% RAG threshold.
- [x] Document that blocker duration may display as `unknown` when Jira history does not expose a usable timestamp.
- [x] Document expected error behavior and confirm failed runs do not write partial reports.
- [x] Add a sample or fixture-based example of the generated Markdown report without real Jira data or credentials.
- [x] Record v1 exclusions and future enhancements from the specification so out-of-scope requests remain explicit.
- [ ] Perform a final onboarding pass from a clean environment and update instructions for any missing step.

## Definition of Done

- [ ] A PM can configure local Jira credentials and generate one dated Markdown report with the documented command.
- [ ] The report contains every required section in the specified order, including explicit empty-result placeholders.
- [ ] RAG status, metrics, blocker handling, and rolling-window behavior are covered by automated tests.
- [ ] Jira/auth/API failures leave no partial report behind and provide an actionable error.
- [ ] Tests pass and documentation enables a new contributor to run the generator without access to committed secrets.

## Session Handoff — 2026-09-08

- Backlog verification corrected the scaffold-review, project-scope metrics, and CLI integration statuses; focused unit, client, rendering, and failure-path checks exist, but a dedicated end-to-end test layout remains open.
- Replaced the calculator scaffold with `generate_status_report.py`, an injectable Jira client, configuration validation, pagination, issue normalization, metrics/RAG logic, Markdown rendering, and dated report writing.
- Added `.env.example`, `requirements.txt`, and `tests/test_report_generator.py`; retained `main.py` as a compatibility entry point.
- Added focused tests for the rolling date range, missing estimates, blocker-driven Red status, and empty report placeholders.
- Editor diagnostics pass. The documented `python` command is unavailable on PATH; runtime tests pass through `uv` with `PYTHONPATH=.`. `py_compile` remains pending.

## Session Handoff - 2026-09-08

- Located `uv` at `C:\Users\Reddi_Prasad_Kuppala\.local\bin\uv.exe`; it provides Python 3.14.7 even though neither `python` nor `uv` is on PATH.
- Ran `$env:PYTHONPATH = (Get-Location).Path; uv run --with-requirements requirements.txt pytest` successfully: 9 tests passed.
- Remaining validation: run `python -m py_compile generate_status_report.py main.py` after adding a real Python executable or `uv` to PATH.
- Expanded `Decisions Made` with the selected technologies, authentication/configuration boundaries, domain architecture, API strategy, output behavior, testing approach, and v1 scope.
- Verified backlog checkboxes against the current source, tests, reports, and README; reopened broad test-layout work that is not yet backed by a dedicated end-to-end test.

## Session Handoff - 2026-09-08

- Prepared the Module 09 completion report using the tracked-file list, backlog commit history, and full backlog contents.