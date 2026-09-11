# Weekly Status Report App Specification

## Document Control

- **Product:** status-report-app
- **Version:** 1.21.0
- **Status:** Draft for implementation
- **Date:** 2026-09-10
- **Technology baseline:** React 18 + Vite frontend; Node.js 24.21.0 + Express
  backend; no database is required for v1.
- **Verified tooling:** npm 11.19.0; Docker 29.7.2.
- **Governing constitution:** [constitution.md](./constitution.md)
- **Source specification:** `work/module03-task/project_spec.md`

## Project Identity

### Name

**status-report-app**

### Purpose

The application is a web-based system that generates a consistent
stakeholder-facing weekly status report for one Jira project. The user supplies
a Project Key and Report Date. The backend retrieves live Jira Cloud data for
the requested seven-day period, calculates metrics and deterministic RAG health,
presents the result in a React interface, writes the generated artifact under
`server/reports/`, and provides a link to the generated file.

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
| Frontend tooling | Vite | 7.1.7 |
| Backend runtime | Node.js | 24.21.0 |
| Backend framework | Express | 5.1.0 |
| Local runtime | Docker | 29.7.2 verified locally; required for local v1 launch |
| Package manager | npm | 11.19.0 verified locally |
| External integration | Jira Cloud REST API v3 | Version 3 |

The client manifest MUST pin `react` 18.3.1, `react-dom` 18.3.1,
`vite` 7.1.7, and `@vitejs/plugin-react` 5.0.4. The server manifest MUST pin
`express` 5.1.0.

`client/package.json` and `server/package.json` MUST declare the exact versions
listed above, and lockfiles MUST be committed when dependencies are installed.
The selected Vite and Express versions support the declared Node.js 24.21.0
runtime. Docker 29.7.2 is the local runtime for launching v1. The application
MUST be launched locally through Docker; no production deployment contract is
required for v1.

UTC is the canonical timezone for Jira queries, Report Date interpretation,
displayed dates, and generated filenames. Additional interval-notation,
rounding-rule, clock-source, and boundary-example decisions are deferred and do
not block v1 implementation.

## Local Configuration

Docker is the only supported launch environment for v1. The application MUST
load configuration from a local `.env` file through the appropriate server and
client configuration files. The server configuration MUST be centralized under
`server/src/config/`, and the client API configuration MUST use Vite's
`VITE_`-prefixed variables.

Required variables:

| Variable | Owner | Required | Purpose |
|---|---|---|---|
| `JIRA_SITE_URL` | Server | Yes | Jira Cloud base URL |
| `JIRA_EMAIL` | Server | Yes | Jira API account email |
| `JIRA_API_TOKEN` | Server | Yes | Jira API token; never exposed to the client |
| `JIRA_PROJECT_KEY` | Server | No | Default Project Key, `EPMCDMETST` when configured |
| `VITE_API_BASE_URL` | Client | No | Express API base URL; defaults to `http://localhost:3000/api` |

The repository MUST provide `server/.env.example` with placeholder values and
MUST keep real `.env` files ignored. Required server variables MUST be validated
at startup. Missing or invalid required configuration MUST prevent report
generation and return a safe configuration error without revealing secret
values. Docker-local configuration is the only v1 configuration target;
production environment and secret-store configuration are out of scope.

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
    reports/            # Generated files only; no persistence in v1
  tests/                # Cross-module and integration tests
  spec/                 # Constitution, specification, plans, and decisions
```

- `client/src` MUST contain frontend code only.
- `server/src` MUST contain backend code only; routes, controllers, services,
  configuration, integrations, and data access MUST remain responsibility-
  focused.
- `tests` MUST contain automated tests and SHOULD mirror the module or behavior
  under test.
- `server/reports` MUST contain generated report files only; report generation
  and download are stateless and no persistence is used in v1.
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
  request state; they MUST NOT contain Jira queries, database logic, or
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
- As a Project Manager, I want to see completed work and blockers in one view so
  that I can prepare a stakeholder
  update quickly.
- As a Project Manager, I want an explicit empty-state message when a section has
  no results so that an empty report is not mistaken for missing data.
- As a Project Manager, I want to preview and download the generated Markdown so
  that I can paste it into email, Confluence, or Slack manually.
- As a Project Manager, I want failures to identify the affected operation
  without exposing credentials so that I can correct configuration safely.

### Secondary user: Stakeholder

- As a stakeholder, I want a concise, predictable report structure so that I can
  scan project progress and blockers quickly.
- As a stakeholder, I want the RAG status to have a visible rationale so that the
  health indicator is understandable rather than subjective.

## Goals and Non-Goals

### Goals

1. Generate a report for exactly one Jira project per request.
2. Use a rolling seven-day reporting window independent of sprint boundaries.
3. Retrieve completed, in-progress, and blocked issue data from Jira Cloud.
4. Calculate deterministic health and summary metrics on the backend, including
  RAG pace from completed points divided by committed points for the window and
  aggregation across all Jira statuses.
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
- Web-application authentication and authorization, including user accounts,
  sessions, role-based permissions, CSRF protection, and project-level user
  authorization.
- Jira pagination, rate-limit handling, retry/backoff behavior, maximum issue
  limits, rate limits, and partial-query recovery.
- Detailed frontend interaction and browser-specific behavior, including
  responsive breakpoints, request cancellation/replacement, clipboard fallback,
  and stale-result interaction rules.

The v1 application is launched locally through Docker and supports general
browsers. Production deployment and browser-specific interaction requirements
are out of scope.

## Workflow

The v1 workflow is:

1. The user opens the dashboard.
2. The user supplies a valid Project Key and Report Date. The Project Key input
  is prefilled with `EPMCDMETST` when no value has been supplied.
3. The user requests report generation.
4. The React client sends the Project Key and Report Date to the Express API.
5. The backend validates configuration, the Project Key, and the Report Date.
6. The backend connects to Jira using credentials from `.env` and queries Jira
  for the required seven-day dataset.
7. The backend normalizes Jira responses and calculates metrics and RAG health.
8. The backend renders the canonical Markdown report and writes it under
  `server/reports/`.
9. The client displays a success message containing the Project Key, Report
  Date, and generated file link, together with the report preview and summary.
10. On failure, the client displays an appropriate error message and full
   available error details, excluding secrets.
11. The user downloads or copies the Markdown. The application does not deliver
   the report to external systems in v1.

The web workflow is the application surface for the report behavior described in
`project_spec.md`; it MUST preserve the same reporting rules and output
semantics as the source specification.

## Functional Requirements

### FR-001: Project selection and validation

- The client MUST provide a project key input.
- The client MUST provide a Report Date input.
- The Project Key input MUST default to `EPMCDMETST` when a value is required
  and the user has not entered another value.
Project Key is a user input, and `EPMCDMETST` is the default when required.
When both values are available, explicit Project Key input takes precedence over
the `EPMCDMETST` default.
- The project key MUST be trimmed and validated before a request is sent.
- A project key MUST be non-empty and use the Jira project-key format supported
  by the configured Jira instance.
- The Report Date MUST be a valid calendar date and MUST NOT be in the future
  unless explicitly permitted by configuration.
- The server MUST validate the project key again and MUST NOT trust client-side
  validation.
- The server MUST use the request-supplied Project Key and Report Date as the
  authoritative report inputs. If Project Key is omitted, the server MUST use
  `EPMCDMETST` as the default before validation.

### FR-002: Reporting window

- Each generation request MUST use a rolling seven-day window ending on the
  user-supplied Report Date.
- The window MUST NOT depend on the current Jira sprint.
- The server MUST calculate and return the effective start and end timestamps.
- Date handling MUST use UTC consistently for JQL, displayed dates, and
  generated filenames.

### FR-003: Jira authentication and access

- Jira calls MUST be made server-side through the Jira Cloud REST API.
- Authentication MUST use `JIRA_EMAIL` and `JIRA_API_TOKEN`.
- The base URL MUST come from `JIRA_SITE_URL`.
- Credentials MUST never be sent to the browser or included in generated
  Markdown.
- Web-application authentication and authorization are out of scope for v1.
- The server MUST request only the fields needed for report generation.
- Non-2xx Jira responses MUST be converted into a safe application error.

### FR-004: Jira queries and required fields

The backend MUST establish one canonical, deduplicated issue universe for the
selected Project Key and seven-day window ending on the user-supplied Report
Date. All Jira statuses MUST be eligible for this universe. The backend MUST
retrieve user stories and bugs whose Jira `Created` field falls within that
window, using the Jira `Project` field to match the Project Key. The logical
query MUST be equivalent to:

`project = {PROJECT_KEY} AND issuetype in (Story, Bug) AND created >= {START} AND created <= {REPORT_DATE}`

The Jira Created/Project filtering over seven days MUST be applied using the
user-supplied Report Date as the window end and the supplied Project Key as the
Jira Project value. Results MUST be deduplicated by Jira issue key before they
are used by any report section, metric, or health calculation.

In-progress and blocker queries MUST use current Jira status and blocker fields,
but MUST also be limited to the same seven-day issue universe. They MUST NOT
silently include older issues outside the report window. To Do, In Progress,
Done, and any other Jira status MUST remain eligible for report aggregation;
unrecognized status names MUST be retained and mapped through their Jira status
category where available.

Each returned Jira item MUST contain these fields:

- `project`
- `key`
- `issuetype`
- `summary`
- `status`
- `assignee`
- `created`
- `reporter`

The backend MUST also execute these logical queries when their data is required
for the health and metrics sections:

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

Canonical report sections: Header; Created User Stories and Bugs; Completed This
Week; Blockers / Impediments.

1. Header with the available Project Key, Report Date, week date range, and
  generation date.
2. Created User Stories and Bugs with the required Jira fields.
3. Completed This Week.
4. Blockers / Impediments, only when blockers exist.

The Created User Stories and Bugs and Completed This Week sections MUST remain
present and MUST display an explicit `None` placeholder when they have no
matching issues. The Blockers / Impediments section MUST be omitted when no
blockers exist. The header MUST use Project Key; a separate project-name lookup
is not required.

### FR-006: Completed issues

Each created user story or bug MUST include project, key, issue type, summary,
status, assignee, created timestamp, and reporter. Only issues created within
the user-selected seven-day window MAY appear in this section.

Each completed issue MUST include its Jira key, summary, and issue type. Only
issues resolved within the rolling seven-day window MAY appear in this section.

### FR-007: Blockers and impediments

An issue MUST be considered blocked when it is not Done and either:

- Jira's Flagged field is `Impediment`; or
- the issue has the `blocked` label.

Each blocker MUST include its Jira key and summary. Blocker duration data is out
of scope for v1; the backend MUST NOT inspect Jira changelogs or calculate days
since flagged. The report MUST NOT require a duration fallback value.

### FR-008: Metrics

The backend MUST calculate and return:

- completed story points for the reporting window;
- committed story points for the reporting window;
- total story points in scope, covering open and completed issues used by the
  report;
- completion percentage as completed points divided by total points in scope;
Status-count metrics are out of scope for v1. The canonical issue universe still
includes all Jira statuses for issue retrieval and applicable report sections,
but the API and Markdown MUST NOT calculate or expose status counts.

Point-based calculations MUST use the Jira `StoryPoints` field. Issues with
missing, null, or unavailable `StoryPoints` MUST be excluded from those
calculations, but MUST remain eligible for issue listings. A
zero denominator MUST NOT produce `NaN` or Infinity in the API or Markdown
output.

`StoryPoints` is the point source for v1. Missing or unavailable `StoryPoints`
values are excluded from point calculations.

For the canonical report issue universe:

- `completedPoints` MUST equal the sum of `StoryPoints` for Jira items whose
  status is `Done`.
- `committedPoints` MUST equal the sum of `StoryPoints` for all Jira items in
  the report universe, regardless of status.
- Items with unavailable `StoryPoints` MUST be excluded from both sums.

### FR-010: RAG health calculation

RAG status MUST be calculated on the server with no v1 manual override:

1. If at least one blocked issue exists, status is **Red**.
2. Otherwise, calculate pace as `completedPoints / committedPoints`, using the
  metric definitions in FR-008.
3. If pace is below 70 percent, status is **Amber**.
4. If pace is at least 70 percent, status is **Green**.
5. If completed points or committed points are unavailable, or committed points
  are zero, skip the pace calculation and report pace as **Unavailable**. The
  application MUST NOT infer Amber or Green from missing point data.

The default threshold MUST be 70 percent and MUST be represented as a named
configuration value so it can be changed without rewriting the decision logic.
Both point sums MUST use the canonical report issue universe for the selected
seven-day window. The response MUST include the completed points, committed
points, pace when available, and a rationale that identifies the deciding
condition.

### FR-011: Markdown-only generation and download

- The backend MUST generate the report in Markdown format only.
- The canonical artifact, download, and report preview source MUST be Markdown.
- HTML, PDF, and other report document formats are not required for v1.
- Dynamic Jira summaries and other values MUST be safely escaped for Markdown.
- The client MUST provide a download action for the generated Markdown.
- The filename MUST follow `status_report_<YYYY-MM-DD>_<HH-mm-ss>Z.md`, using
  the UTC generation timestamp as a suffix.
- A failed request MUST NOT create or offer a partial report.

### FR-012: Stateless v1 execution without a database

Report generation and download MUST be stateless in v1. The server MUST NOT
persist reports, create report-history identifiers, or require a database for a
successful generation request. PostgreSQL, database access, database schemas,
migrations, persistence, and database Docker services are out of scope for v1.

FR-012 explicitly excludes all database requirements from v1.

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

### Local Docker API delivery

Docker is the only supported local launch method for v1. The implementation
MUST provide a Docker-based local environment that starts the React client and
Express server. The default local origins are:

- React client: `http://localhost:5173`
- Express API: `http://localhost:3000`

The client MUST read its API base URL from `VITE_API_BASE_URL`, defaulting to
`http://localhost:3000/api` for local Docker use. The server MUST allow CORS
from `http://localhost:5173`, accept JSON requests, and return JSON responses
with `Content-Type: application/json`. Production origins, external delivery,
and production CORS configuration are out of scope for v1.

### Generate report

`POST /api/reports`

Request:

```json
{
  "projectKey": "EPMCDMETST",
  "reportDate": "2026-09-10"
}
```

Successful response: `200 OK`

```json
{
  "project": {
    "key": "EPMCDMETST"
  },
  "window": {
    "start": "2026-09-04T00:00:00.000Z",
    "end": "2026-09-10T23:59:59.999Z",
    "timezone": "UTC"
  },
  "sections": {
    "createdItems": [],
    "completed": [],
    "blockers": []
  },
  "markdown": "# Weekly Status Report\n...",
  "reportFile": {
    "path": "server/reports/status_report_2026-09-10_143012Z.md",
    "url": "/reports/status_report_2026-09-10_143012Z.md"
  }
}
```

API metrics example: the v1 response contains point metrics only and
intentionally omits the status-count field because status-count metrics are out
of scope. The v1 API does not require To Do, In Progress, or Done counts.

Error response shape:

```json
{
  "error": {
    "code": "JIRA_AUTHENTICATION_FAILED",
    "message": "Unable to authenticate with Jira. Check server configuration."
  }
}
```

The API MUST return a clear error response for invalid input, missing
configuration, Jira authentication failure, Jira upstream failure, and
unexpected server failure. Exact HTTP status mappings, retryability labels, and
a separate internal error-code matrix are out of scope for v1. Error messages
MUST be safe for end users and MUST NOT include tokens, authorization headers,
raw credentials, or unnecessary Jira payloads.

Safe error messages remain required for invalid input, missing configuration,
and Jira failures. Exact HTTP status mappings and retryability labels are out of
scope for v1.

The successful response MUST include a generated report artifact link to the
file under `server/reports/`. The client MUST use that link for local preview or
download; it MUST NOT require a separate external delivery service.

The API project object is `{ "key": "<PROJECT_KEY>" }` and contains the
Project Key only; project-name metadata is not required in v1.

### Health endpoint

Health endpoint dependency semantics are out of scope for v1. The application
does not require separate liveness/readiness endpoints or Jira/PostgreSQL
dependency checks. If `GET /api/health` is implemented, it MAY provide only a
basic Express process check and MUST NOT expose secrets or connection strings.

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
- `resolvedAt` or `null`

Jira-specific field names MUST remain inside the adapter or mapping layer. The
adapter MUST map Jira `StoryPoints` to the internal `storyPoints` value and MUST
return `null` when `StoryPoints` is unavailable.
Report calculations and rendering MUST consume normalized data.

Blocker duration and changelog data MUST NOT be required by the v1 normalized
issue model.

No persistence is used in v1. The normalized issue model is the only required
backend data model.

## Non-Functional Requirements

### Security

- Secrets MUST be server-only and environment-driven.
- `.env` files containing real credentials MUST remain ignored by version
  control; `.env.example` MUST contain placeholders only.
- Inputs MUST be validated and safely encoded before use in JQL.
- Logs MUST exclude tokens, authorization headers, and full sensitive payloads.

### Reliability

- Jira failures MUST fail the generation request clearly and atomically.
- The application MUST NOT display stale data as a newly generated report.

### Performance

- The dashboard SHOULD show an initial response within two seconds excluding
  Jira network latency.
  - The server SHOULD avoid redundant Jira requests.
- The client MUST remain responsive while generation is in progress.

### Accessibility and usability

- Use semantic HTML and accessible names for all controls.
- Support keyboard-only operation and visible focus.
- Do not communicate RAG status by color alone; include text labels.
- Ensure report tables, lists, metrics, and error messages are readable at
  desktop and mobile widths.

### Maintainability

- React components MUST not contain backend business rules.
- Jira integration, normalization, calculations, and Markdown rendering MUST be
  independently testable modules.
- API contracts and setup instructions MUST be updated when behavior changes.

## Acceptance Criteria

### Scenario A: Successful report with work and blockers

**Given** valid Jira configuration and a valid project key
**When** the user generates a report
**Then** the server queries Jira, returns a successful response, writes the
report under `server/reports/`, and renders these four sections in order:
Header, Created User Stories and Bugs, Completed This Week, and Blockers /
Impediments. Exactly four sections are rendered. The Blockers / Impediments
section contains the current blocker when one exists.

### Scenario B: Successful report with no blockers

**Given** valid Jira data with no current blockers
**When** completion is at least 70 percent of expected pace
**Then** health is Green and the rationale states that no blockers exist and pace
meets the threshold.

### Scenario C: Below expected pace

**Given** valid Jira data with no blockers
**When** completion is below the configured 70 percent threshold
**Then** health is Amber and the rationale states that pace is below threshold.

### Scenario C1: Missing point data

**Given** there are no current blockers and completed points or committed points
are unavailable, or committed points are zero
**When** the report health is calculated
**Then** the pace calculation is ignored, the report marks pace as Unavailable,
and the application does not infer Amber or Green from missing data.

### Scenario C2: Point metric definitions

**Given** the canonical report issue universe contains Done and non-Done Jira
items with usable StoryPoints
**When** metrics are calculated
**Then** `completedPoints` equals the sum of StoryPoints for Done items and
`committedPoints` equals the sum of StoryPoints for all report items.

### Scenario D: Empty query results

**Given** Jira returns no issues for one or more queries
**When** report generation succeeds
**Then** the corresponding report section remains present and displays the
required explicit empty placeholder.

### Scenario D1: Seven-day all-status scope

**Given** Jira returns issues in To Do, In Progress, Done, and another valid
status for the selected Project Key
**When** the report is generated for a Report Date
**Then** only issues in the seven-day report universe are eligible, current
in-progress and blocker filters are applied within that universe, duplicate
issue keys are counted once, and all eligible statuses remain available for
applicable report sections without status-count metrics.

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

### Scenario G: Missing StoryPoints data

**Given** a report issue has no usable `StoryPoints` value
**When** the report is generated
**Then** the issue remains listed with `Not provided` and is ignored for
point-based calculations.

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
**Then** the downloaded file contains the canonical Markdown, uses the
`status_report_<YYYY-MM-DD>_<HH-mm-ss>Z.md` filename pattern, and the UI
provides the generated file link with the Project Key and Report Date.

## Test Strategy

The implementation MUST provide:

- unit tests for rolling-window calculation, normalization, metrics, RAG rules,
  empty sections, missing estimates, and zero denominators;
- Jira adapter tests using mocked responses and non-2xx responses;
- API tests for validation, success, safe errors, and duplicate-request
  behavior;
- Markdown snapshot or structural tests for section order and required fields;
- frontend tests for form submission, loading, success, empty, error, and
  download states;
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
- report history and comparison views;
- Database persistence, migrations, schemas, and audit retention policies.

## Traceability

| Source requirement | Covered by |
|---|---|
| Single project and rolling seven-day window | FR-001, FR-002 |
| Jira Cloud REST API and authentication | FR-003, FR-004 |
| Created user stories and bugs with required Jira fields | FR-004, FR-005, FR-006 |
| Seven-day all-status issue universe and deduplication | FR-004, FR-009, Scenario D1 |
| Created, completed, and blocker sections | FR-005 through FR-008 |
| Metrics and deterministic RAG | FR-009, FR-010, Scenario C1 |
| Markdown output and dated filename | FR-011 |
| No database requirements for v1 | FR-012, Out-of-Scope |
| Safe failures and explicit empty states | FR-005, FR-013, Scenarios D-E |
| No v1 delivery, aggregation, or trend features | Goals and Non-goals, Section 11 |

## Open Decisions

1. Confirm no alternate point field is required beyond Jira `StoryPoints`.
