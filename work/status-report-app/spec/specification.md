# Weekly Status Report App Specification

## Document Control

- **Product:** status-report-app
- **Version:** 1.1.0
- **Status:** Draft for implementation
- **Date:** 2026-09-10
- **Technology baseline:** React 18 + Vite frontend; Node.js 24.21.0 + Express
  backend; PostgreSQL 15 through Docker when persistence is enabled.
- **Verified tooling:** npm 11.19.0; Docker 29.7.2.
- **Governing constitution:** [constitution.md](./constitution.md)
- **Source specification:** `work/module03-task/project_spec.md`

## Project Identity

### Name

**status-report-app**

### Purpose

The application generates a consistent stakeholder-facing weekly status report
for one Jira project. It retrieves live Jira Cloud data, calculates metrics and
deterministic RAG health, presents the result in a React interface, and
produces Markdown that a Project Manager can share manually.

### Target Users

- **Primary user:** Project Manager responsible for preparing a weekly update
  for a 10-person Agile Scrum team.
- **Secondary audience:** External or upward stakeholders who need to scan
  progress, risks, blockers, and overall project health.

## Technology Stack and Versions

The implementation MUST use the following stack:

| Layer | Technology | Required version |
|---|---|---|
| Frontend | React | 18.x |
| Frontend tooling | Vite | Version MUST be pinned in `client/package.json` before implementation |
| Backend runtime | Node.js | 24.21.0 |
| Backend framework | Express | Version MUST be pinned in `server/package.json` before implementation |
| Database | PostgreSQL | 15.x |
| Local database | Docker | 29.7.2 verified locally; compatible Docker versions are acceptable for contributors |
| Package manager | npm | 11.19.0 verified locally |
| External integration | Jira Cloud REST API v3 | Version 3 |

`client/package.json` and `server/package.json` MUST declare exact dependency
versions or an approved lockfile. The Vite and Express versions are currently
open implementation decisions because the existing manifests do not yet declare
them; they MUST be resolved before the first implementation commit.

## Folder Structure Conventions

The repository MUST use this structure:

```text
status-report-app/
  client/
    package.json
    vite.config.js
    src/
      components/       # Reusable React presentation components
      pages/            # Route-level page components
      services/         # Browser-side API clients only
      App.jsx
      main.jsx
  server/
    package.json
    .env.example
    src/
      config/           # Environment and application configuration
      controllers/      # HTTP request/response orchestration
      routes/           # Express route declarations
      services/         # Domain logic and Jira integration
      templates/        # Markdown/report templates
      utils/            # Small shared backend utilities
    reports/            # Generated files only, when filesystem output is used
  tests/                # Cross-module and integration tests
  spec/                 # Constitution, specification, plans, and decisions
```

- `client/src` MUST contain frontend code only.
- `server/src` MUST contain backend code only; routes, controllers, services,
  configuration, integrations, and data access MUST remain responsibility-
  focused.
- `tests` MUST contain automated tests and SHOULD mirror the module or behavior
  under test.
- `server/reports` MUST contain generated report artifacts only and MUST NOT
  contain source modules.
- `spec` MUST contain project specifications and planning artifacts, not runtime
  code.
- Root-level files MUST be limited to project-wide configuration, onboarding,
  and operational metadata.

## Coding Standards

### Naming

- JavaScript variables, functions, and React props MUST use `camelCase`.
- React components and classes MUST use `PascalCase`.
- Configuration and domain-threshold constants MUST use `UPPER_SNAKE_CASE`.
- **File naming:** React component files MUST use `PascalCase.jsx`.
- Services, routes, controllers, configuration, utilities, and test files MUST
  use descriptive `camelCase.js` or lowercase names consistently within their
  directory.
- Names MUST describe responsibility and MUST NOT use unexplained abbreviations.

### File organization and boundaries

- **Single responsibility:** Each file MUST have one primary responsibility.
- React components MUST focus on presentation, interaction, accessibility, and
  request state; they MUST NOT contain Jira queries, persistence logic, or
  report-calculation rules.
- Controllers MUST translate HTTP requests and responses and delegate business
  behavior to services or domain modules.
- Jira field mapping MUST remain in the Jira adapter/integration layer.
- Database access MUST remain behind a server-side data-access module.
- Shared behavior MUST be extracted into a named module rather than duplicated.
- **Validation and quality gates:** Boundary functions MUST validate inputs and
  return the documented API error shape. Formatting, linting, and automated
  tests MUST pass before a change is ready for review.
- Secrets MUST never appear in source literals, filenames, logs, tests, or
  fixtures.

## Problem/Purpose

Project Managers currently need to collect Jira activity manually before sharing
a weekly stakeholder update. This creates inconsistent reports, consumes time,
and makes project health harder to assess.

The application MUST generate a consistent stakeholder-facing weekly status
report for one Jira project. It MUST retrieve live Jira Cloud data, calculate
metrics and deterministic RAG health, present the result in a usable React
interface, and produce Markdown that can be shared manually.

## User Stories

### Primary user: Project Manager

- As a Project Manager, I want to enter or select a Jira project key and
  generate a report for the last seven days so that I do not compile ticket data
  manually.
- As a Project Manager, I want to see overall health, completed work, in-progress
  risks, blockers, and metrics in one view so that I can prepare a stakeholder
  update quickly.
- As a Project Manager, I want an explicit empty-state message when a section has
  no results so that an empty report is not mistaken for missing data.
- As a Project Manager, I want to preview and download the generated Markdown so
  that I can paste it into email, Confluence, or Slack manually.
- As a Project Manager, I want failures to identify the affected operation
  without exposing credentials so that I can correct configuration safely.

### Secondary user: Stakeholder

- As a stakeholder, I want a concise, predictable report structure so that I can
  scan project progress and risks quickly.
- As a stakeholder, I want the RAG status to have a visible rationale so that the
  health indicator is understandable rather than subjective.

## Goals and Non-Goals

### Goals

1. Generate a report for exactly one Jira project per request.
2. Use a rolling seven-day reporting window independent of sprint boundaries.
3. Retrieve completed, in-progress, and blocked issue data from Jira Cloud.
4. Calculate deterministic health and summary metrics on the backend.
5. Render the report in a stable Markdown structure and a readable web preview.
6. Preserve security boundaries around Jira credentials and project data.
7. Provide reliable loading, empty, validation, and upstream-error states.

### Non-goals for v1

- Automated email, Slack, Teams, or Confluence delivery.
- Multi-project aggregation.
- Per-assignee workload reporting.
- A manually editable Next Sprint Goals section.
- Burndown, velocity, or graphical trend charts.
- Week-over-week comparisons.
- Scheduled report generation.
- Manual RAG overrides.
- Public or anonymous access.

## Workflow

The v1 workflow is:

1. The user opens the dashboard.
2. The user supplies a valid Jira project key, or uses the configured default.
3. The user requests report generation.
4. The React client sends a request to the Express API.
5. The backend validates configuration and the project key.
6. The backend queries Jira Cloud for the three report datasets.
7. The backend normalizes Jira responses and calculates metrics and RAG health.
8. The backend renders the canonical Markdown report.
9. The client displays the report preview and summary data.
10. The user downloads or copies the Markdown. The application does not deliver
    the report to external systems in v1.

The web workflow is the application surface for the report behavior described in
`project_spec.md`; it MUST preserve the same reporting rules and output
semantics as the source specification.

## Functional Requirements

### FR-001: Project selection and validation

- The client MUST provide a project key input.
- The project key MUST be trimmed and validated before a request is sent.
- A project key MUST be non-empty and use the Jira project-key format supported
  by the configured Jira instance.
- The server MUST validate the project key again and MUST NOT trust client-side
  validation.
- The server MUST use `JIRA_PROJECT_KEY` as the default only when the product
  configuration permits a default; a request-supplied key takes precedence.

### FR-002: Reporting window

- Each generation request MUST use a rolling seven-day window ending at the
  request's report date/time.
- The window MUST NOT depend on the current Jira sprint.
- The server MUST calculate and return the effective start and end timestamps.
- Date handling MUST use one documented timezone policy consistently for JQL,
  displayed dates, and generated filenames.

### FR-003: Jira authentication and access

- Jira calls MUST be made server-side through the Jira Cloud REST API.
- Authentication MUST use `JIRA_EMAIL` and `JIRA_API_TOKEN`.
- The base URL MUST come from `JIRA_SITE_URL`.
- Credentials MUST never be sent to the browser or included in generated
  Markdown.
- The server MUST request only the fields needed for report generation.
- Non-2xx Jira responses MUST be converted into a safe application error.

### FR-004: Jira queries

The backend MUST execute these logical queries for the selected project:

- **Completed:**
  `project = {PROJECT_KEY} AND statusCategory = Done AND resolved >= -7d`
- **In progress:**
  `project = {PROJECT_KEY} AND statusCategory = "In Progress"`
- **Blocked:**
  `project = {PROJECT_KEY} AND (flagged = Impediment OR labels = "blocked") AND statusCategory != Done`

The implementation MAY use explicit calculated timestamps instead of `-7d` when
that is necessary to enforce the documented timezone policy, but the resulting
window MUST be equivalent.

### FR-005: Report sections and order

The canonical report MUST contain these sections in this order:

1. Header with project name/key, week date range, and generation date.
2. Overall Health with Red, Amber, or Green status and one-line rationale.
3. Completed This Week.
4. In-Progress / At-Risk Items.
5. Blockers / Impediments.
6. Metrics Summary.

A section with no matching issues MUST remain present and MUST display an
explicit `None` placeholder. The blockers section MUST display `No blockers
reported.` when there are no blockers.

### FR-006: Completed issues

Each completed issue MUST include its Jira key, summary, and issue type. Only
issues resolved within the rolling seven-day window MAY appear in this section.

### FR-007: In-progress and at-risk issues

Each in-progress issue MUST include its Jira key, summary, current status, and
story points or estimate when available. Missing estimates MUST be represented
as `Not provided` or the equivalent canonical value, not silently omitted from
an otherwise valid issue row.

### FR-008: Blockers and impediments

An issue MUST be considered blocked when it is not Done and either:

- Jira's Flagged field is `Impediment`; or
- the issue has the `blocked` label.

Each blocker MUST include its Jira key and summary. The report SHOULD include
the number of days since it was flagged when a reliable flagged timestamp or
changelog entry is available. It MUST clearly indicate when the duration cannot
be derived.

### FR-009: Metrics

The backend MUST calculate and return:

- completed story points for the reporting window;
- total story points in scope, covering open and completed issues used by the
  report;
- completion percentage as completed points divided by total points in scope;
- counts for To Do, In Progress, and Done statuses.

The implementation MUST define behavior for missing, null, non-numeric, or zero
story-point values. A zero denominator MUST NOT produce `NaN` or Infinity in the
API or Markdown output.

### FR-010: RAG health calculation

RAG status MUST be calculated on the server with no v1 manual override:

1. If at least one blocked issue exists, status is **Red**.
2. If there are no blockers and completion is below 70 percent of expected pace,
   status is **Amber**.
3. If there are no blockers and completion is at least 70 percent of expected
   pace, status is **Green**.

The default threshold MUST be 70 percent and MUST be represented as a named
configuration value so it can be changed without rewriting the decision logic.
The response MUST include a rationale that identifies the deciding condition.

### FR-011: Markdown generation and download

- The backend MUST generate one canonical Markdown representation per successful
  report request.
- The client MUST provide a download action for the generated Markdown.
- The default filename MUST follow `status_report_<YYYY-MM-DD>.md`.
- A failed request MUST NOT create or offer a partial report.
- Existing reports MUST NOT be overwritten when report history is persisted.

### FR-012: Report history and PostgreSQL

Persistence is conditional for v1. If report history is enabled, PostgreSQL 15
MUST store the generated report metadata and content through a server-side data
access layer. The schema MUST retain the project key, reporting window,
generation timestamp, health status, Markdown content, and a unique report
identifier.

If persistence is not enabled, the application MUST still support generation and
download without requiring PostgreSQL. When PostgreSQL is used locally, Docker
MUST provide the reproducible database environment and documented startup
commands.

### FR-013: User-visible states

The client MUST provide accessible states for:

- initial form state;
- generating/loading;
- successful report preview;
- validation failure;
- Jira authentication or upstream failure;
- server failure;
- no results in one or more sections.

The generate action MUST prevent duplicate submissions while a request is in
progress and MUST become available again after success or failure.

## API Contract

### Generate report

`POST /api/reports`

Request:

```json
{
  "projectKey": "EPMCDMETST"
}
```

Successful response: `200 OK`

```json
{
  "reportId": "optional-report-id",
  "project": {
    "key": "EPMCDMETST",
    "name": "Example project"
  },
  "window": {
    "start": "2026-09-03T00:00:00.000Z",
    "end": "2026-09-10T00:00:00.000Z",
    "timezone": "UTC"
  },
  "health": {
    "status": "Green",
    "rationale": "No blockers reported and the project is at or above the expected pace.",
    "threshold": 0.7
  },
  "sections": {
    "completed": [],
    "inProgress": [],
    "blockers": []
  },
  "metrics": {
    "completedPoints": 0,
    "totalPoints": 0,
    "completionPercentage": 0,
    "statusCounts": {
      "toDo": 0,
      "inProgress": 0,
      "done": 0
    }
  },
  "markdown": "# Weekly Status Report\n..."
}
```

Error response shape:

```json
{
  "error": {
    "code": "JIRA_AUTHENTICATION_FAILED",
    "message": "Unable to authenticate with Jira. Check server configuration."
  }
}
```

Required error categories include invalid project key, missing configuration,
Jira authentication failure, Jira upstream failure, database failure, and
unexpected server failure. Error messages MUST be safe for end users and MUST
NOT include tokens, authorization headers, raw credentials, or unnecessary Jira
payloads.

### Health endpoint

`GET /api/health` SHOULD return `200 OK` when the Express service is running and
an appropriate non-2xx response when a required dependency check fails. The
health response MUST NOT expose secrets or connection strings.

## Data Model

### Normalized issue

The Jira adapter MUST normalize provider responses into an internal shape with
at least:

- `key`
- `summary`
- `issueType`
- `status`
- `statusCategory`
- `storyPoints` or `null`
- `isBlocked`
- `blockedSince` or `null`
- `resolvedAt` or `null`

Jira-specific field names MUST remain inside the adapter or mapping layer.
Report calculations and rendering MUST consume normalized data.

### Persisted report (optional)

When persistence is enabled, a report record MUST include:

- unique identifier;
- project key and project name when available;
- window start and end;
- generated timestamp;
- health status and rationale;
- metrics snapshot;
- canonical Markdown;
- schema creation/update timestamps.

## Non-Functional Requirements

### Security

- Secrets MUST be server-only and environment-driven.
- `.env` files containing real credentials MUST remain ignored by version
  control; `.env.example` MUST contain placeholders only.
- Inputs MUST be validated and safely encoded before use in JQL or persistence.
- Logs MUST exclude tokens, authorization headers, and full sensitive payloads.

### Reliability

- Jira failures MUST fail the generation request clearly and atomically.
- The application MUST NOT display stale data as a newly generated report.
- Retry behavior, if added, MUST be bounded and MUST NOT duplicate persisted
  reports.

### Performance

- The dashboard SHOULD show an initial response within two seconds excluding
  Jira network latency.
- The server SHOULD avoid redundant Jira requests and MUST handle Jira paging
  correctly when result counts exceed one page.
- The client MUST remain responsive while generation is in progress.

### Accessibility and usability

- Use semantic HTML and accessible names for all controls.
- Support keyboard-only operation and visible focus.
- Do not communicate RAG status by color alone; include text labels.
- Ensure report tables, lists, metrics, and error messages are readable at
  desktop and mobile widths.

### Maintainability

- React components MUST not contain backend business rules.
- Jira integration, normalization, calculations, Markdown rendering, and
  persistence MUST be independently testable modules.
- API contracts and setup instructions MUST be updated when behavior changes.

## Acceptance Criteria

### Scenario A: Successful report with work and blockers

**Given** valid Jira configuration and a valid project key
**When** the user generates a report
**Then** the server queries Jira, returns a successful response, renders all six
report sections in order, and marks health Red when at least one current blocker
exists.

### Scenario B: Successful report with no blockers

**Given** valid Jira data with no current blockers
**When** completion is at least 70 percent of expected pace
**Then** health is Green and the rationale states that no blockers exist and pace
meets the threshold.

### Scenario C: Below expected pace

**Given** valid Jira data with no blockers
**When** completion is below the configured 70 percent threshold
**Then** health is Amber and the rationale states that pace is below threshold.

### Scenario D: Empty query results

**Given** Jira returns no issues for one or more queries
**When** report generation succeeds
**Then** the corresponding report section remains present and displays the
required explicit empty placeholder.

### Scenario E: Jira authentication failure

**Given** Jira rejects authentication
**When** the user generates a report
**Then** the API returns a safe authentication error, the UI shows a corrective
message, and no partial report is created or downloadable.

### Scenario F: Invalid input

**Given** an empty or malformed project key
**When** the user submits the form
**Then** the client shows validation feedback, the server is not called, and
server-side validation would reject the same value if submitted directly.

### Scenario G: Missing estimate data

**Given** an in-progress issue has no usable story-point value
**When** the report is generated
**Then** the issue remains listed and its estimate is represented explicitly as
not provided.

### Scenario H: Zero points in scope

**Given** all issues have missing or zero story points
**When** metrics are calculated
**Then** the API and Markdown contain finite, understandable values and never
emit `NaN`, Infinity, or a division-by-zero error.

### Scenario I: Secure frontend boundary

**Given** the application is built and served to a browser
**When** a user inspects client assets or API responses
**Then** Jira credentials and authorization headers are absent.

### Scenario J: Report download

**Given** a report has been generated successfully
**When** the user selects download
**Then** the downloaded file contains the canonical Markdown and uses the
`status_report_<YYYY-MM-DD>.md` filename pattern.

## Test Strategy

The implementation MUST provide:

- unit tests for rolling-window calculation, normalization, metrics, RAG rules,
  empty sections, missing estimates, and zero denominators;
- Jira adapter tests using mocked responses, including pagination and non-2xx
  responses;
- API tests for validation, success, safe errors, and duplicate-request
  behavior;
- Markdown snapshot or structural tests for section order and required fields;
- frontend tests for form submission, loading, success, empty, error, and
  download states;
- database integration tests and migration checks when persistence is enabled.

Tests MUST be deterministic and MUST NOT require live Jira credentials.

## Out-of-Scope

The following require a new specification decision before implementation:

- automated delivery to email, Slack, Teams, or Confluence;
- multi-project reports;
- per-assignee breakdowns;
- configurable user-level RAG overrides;
- burndown and velocity charts;
- historical trend comparisons;
- scheduled report generation;
- richer report history and comparison views;
- expanded persistence and audit retention policies.

## Traceability

| Source requirement | Covered by |
|---|---|
| Single project and rolling seven-day window | FR-001, FR-002 |
| Jira Cloud REST API and authentication | FR-003, FR-004 |
| Completed, in-progress, and blocker sections | FR-005 through FR-008 |
| Metrics and deterministic RAG | FR-009, FR-010 |
| Markdown output and dated filename | FR-011 |
| Optional PostgreSQL 15 and Docker | FR-012 |
| Safe failures and explicit empty states | FR-005, FR-013, Scenarios D-E |
| No v1 delivery, aggregation, or trend features | Goals and Non-goals, Section 11 |

## Open Decisions

1. Confirm whether report history is enabled in v1 or whether generation is
   stateless with download-only output.
2. Confirm the canonical timezone for the seven-day window and displayed dates.
3. Confirm the Jira custom field identifier used for story points.
4. Confirm the exact Jira field and changelog representation used to derive
   `blockedSince`.
5. Confirm whether authentication to the web application is required beyond
   server-side Jira authentication.
