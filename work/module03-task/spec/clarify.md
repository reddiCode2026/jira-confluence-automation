# Specification Clarifications

## Review Summary

The constitution and specification provide a strong product direction and a
useful initial API shape, but they are not yet implementation-complete. The
highest-risk unresolved areas are the RAG calculation, the definition of the
report's Jira data scope, the stateless-versus-persisted execution model, and
the boundary between the existing Python report generator and the proposed
React/Express application.

Items are grouped by severity:

- **Blocker:** Implementation or acceptance testing cannot proceed reliably.
- **High:** Likely to produce incorrect reports, incompatible modules, or
  security/operational defects.
- **Medium:** Important behavior is underspecified but has a reasonable default.
- **Low:** Clarification improves maintainability or usability without blocking
  the first implementation.

## Blockers

### C-001: Define the canonical implementation boundary — CLARIFIED

**Affected sections:** Document Control, Workflow, FR-003, FR-011, FR-012

The source specification describes a manual `python generate_status_report.py`
workflow and writes reports under `work/module03-task/reports/`. The application
specification describes a React 18/Vite client calling a Node.js/Express API and
writes generated artifacts, when applicable, under `server/reports/`. It is not
clear whether the app replaces the Python CLI, wraps it, or must keep both as
supported entry points.

**Resolution:** v1 is a web-based application. The user supplies a Project Key
and Report Date. The Node.js/Express backend connects to Jira through the Jira
API using credentials from `.env`, retrieves the required Jira items created in
the seven days ending on the supplied Report Date, generates the report, and
writes the artifact under `server/reports/`. The application displays a
success message containing the Project Key, Report Date, and generated file
link. On failure, it displays an appropriate message with full available error
details that do not expose secrets.

In short: web-based app; Project Key and Report Date inputs; Jira credentials
from `.env`; Jira API access; output under `server/reports/`; success message
with generated file link; and detailed safe error messages.

The Python CLI is not the v1 web entry point. The web application's backend
owns the canonical queries, calculations, renderer, and output behavior.

### C-002: Resolve the RAG formula — CLARIFIED

**Affected sections:** FR-009, FR-010, Scenario B, Scenario C, Traceability

The specification uses both `completionPercentage` and “70 percent of expected
pace,” but does not define expected pace mathematically. The source document
says expected pace is completed points divided by total open plus completed
points, which is the same ratio later called completion percentage. Comparing a
ratio to 70 percent of itself is not a meaningful pace rule. It is also unclear
whether “committed” means sprint commitment, all issues in the project, or the
union of the query results.

**Resolution:** Use completed points divided by committed points for the selected
seven-day window for the RAG pace calculation. If completed points or committed
points are unavailable, or committed points are zero, the pace calculation MUST
be ignored and the report MUST mark pace as unavailable rather than infer a
Green or Amber result from missing data. Blockers retain precedence and MUST
still produce Red.

**C-002 decision:** Use completed points divided by committed points for the selected seven-day window; ignore the pace calculation when data is unavailable or committed points are zero; blockers still produce Red.

### C-003: Define the report's Jira data scope and query union — CLARIFIED

**Affected sections:** FR-004, FR-005, FR-009, FR-010

The completed query is restricted to the seven-day window, but the in-progress
and blocked queries are not. Metrics require To Do, In Progress, and Done
counts and total open plus completed points, but no query retrieves the full
project scope or To Do issues. The three result sets may overlap, and no rule
defines deduplication.

**Resolution:** The report uses one canonical issue universe for the selected
Project Key and seven-day window ending on the user-supplied Report Date. All
Jira statuses are included in that universe. In-progress and blocker results
are current-state filters, but they are also limited to issues in the same
seven-day window. Results MUST be deduplicated by Jira issue key before metrics,
RAG evaluation, and rendering. To Do, In Progress, Done, and any
other Jira status are eligible for the report; status-category mapping is used
for aggregation rather than excluding unrecognized statuses.

**C-003 decision:** Use one seven-day issue universe; limit current-state in-progress and blocker filters to that seven-day window; include all statuses; deduplicate by issue key before calculations and rendering.

### C-004: Decide whether persistence is in v1 — OUT OF SCOPE

**Affected sections:** FR-011, FR-012, Test Strategy, Out-of-Scope

PostgreSQL and report history are described as conditional, while other rules
refer to persisted report IDs, non-overwriting history, database failures, and
migration tests. The API response calls `reportId` optional, so clients cannot
know whether history exists or whether a report can be retrieved later.

**Resolution:** Report generation/download is stateless for v1. PostgreSQL
persistence, report history, report retrieval endpoints, migrations, retention,
and database-failure handling are out of scope for the initial release. These
capabilities require a future specification decision before implementation.

## High-Priority Gaps and Contradictions

### C-005: Pin Vite and Express versions — CLARIFIED

**Affected sections:** Technology Stack and Versions, Constitution Technical
Constraints

React, Node.js, PostgreSQL, Docker, and npm versions are stated, but Vite and
Express remain open decisions. The constitution says dependencies must be
compatible with declared versions, and the specification says the stack MUST be
used.

**Resolution:** Use Vite 7.1.7 with React 18.3.1 in the frontend and Express
5.1.0 in the backend. These versions target Node.js 24.21.0 and npm 11.19.0.
The exact versions are recorded in `client/package.json` and
`server/package.json`; lockfiles MUST be committed when dependencies are
installed. Docker 29.7.2 is the local verification environment only and is not
required for the stateless v1 report flow.

### C-006: Define the rolling-window timezone and boundary semantics — CLARIFIED

**Affected sections:** FR-002, FR-004, API response, Open Decisions

The API example uses UTC, but UTC is not ratified as the canonical timezone. It
is unclear whether the seven-day interval is inclusive or exclusive at each
boundary, how Jira's site timezone affects `resolved`, and whether the displayed
week dates are calendar dates or exact timestamps.

**Resolution:** UTC is the canonical timezone for Jira queries, report dates,
displayed dates, and generated filenames. Other details listed in the original
decision request, including interval notation, rounding rules, clock-source
selection, and boundary examples, are ignored for this clarification and are
not implementation blockers for v1.

### C-007: Define the story-point field and numeric policy — CLARIFIED

**Affected sections:** FR-007, FR-009, Data Model, Open Decisions

The specification refers to story points or estimates but does not identify the
Jira custom field ID, fallback fields, accepted numeric types, negative values,
or behavior for duplicate/invalid values. “Total committed” is also not
represented in the API response.

**Resolution:** Use the Jira `StoryPoints` field when it is available. If
`StoryPoints` is missing or unavailable for an issue, ignore that issue for
point-based calculations. The issue MUST remain available for issue listings,
status counts, and other non-point report behavior.

**C-007 decision:** Missing or unavailable `StoryPoints` values are ignored for
point calculations; the issue remains available for listings and status counts.

### C-008: Define blocker duration data and fallback behavior — CLARIFIED

**Affected sections:** FR-008, Data Model, Open Decisions

Jira's Flagged field may identify current state but does not necessarily provide
a flagged timestamp. The specification asks for days since flagged when
available, but does not define changelog expansion, timezone, multiple flag/unflag
cycles, or the text shown when no timestamp exists.

**Resolution:** Blocker duration data and fallback behavior are out of scope for
v1. The application MUST identify and list current blockers, but MUST NOT
inspect Jira changelogs or calculate days since flagged. `blockedSince` and any
duration fallback value are deferred until a future clarification.

**C-008 decision:** Blocker duration data and fallback behavior are out of scope
for v1; do not inspect changelogs or calculate days since flagged.

### C-009: Define project-key input versus configured default — CLARIFIED

**Affected sections:** User Stories, Workflow, FR-001

The workflow allows a user-supplied project key or configured default, while the
user story says the user enters or selects a key. No behavior defines whether
the input is optional, which value wins when both exist, or how the user learns
which default is active.

**Resolution:** Project Key is a user input. The UI MUST use `EPMCDMETST` as
the default value when a value is required. An explicitly entered Project Key
takes precedence over the default. The server MUST validate the final value
before running Jira queries.

**C-009 decision:** Project Key is a user input; use `EPMCDMETST` as the default
when required; explicit user input takes precedence.

### C-010: Define authentication and authorization for the web application — OUT OF SCOPE

**Affected sections:** Non-goals, FR-003, API Contract, Scenario I

Public or anonymous access is out of scope, but no web authentication mechanism
is specified. Server-side Jira authentication does not authenticate the user or
protect the report endpoint. There is no session, identity, authorization, or
CSRF policy.

**Resolution:** Authentication and authorization for the web application are out
of scope for this implementation. The v1 application will not implement user
accounts, sessions, role-based permissions, CSRF handling, or project-level user
authorization. Jira API credentials remain server-side and are used only for
the configured Jira integration.

**C-010 decision:** Web-application authentication and authorization are out of scope for v1; user accounts, sessions, permissions, and CSRF protection are not implemented.

### C-011: Define Jira pagination, rate limits, and partial query failure — OUT OF SCOPE

**Affected sections:** FR-003, FR-004, Performance, Reliability, Test Strategy

The test strategy mentions pagination, but the API contract does not define page
size, maximum pages, rate-limit handling, retry/backoff, timeout, or behavior
when one of the three Jira queries succeeds and another fails.

**Resolution:** Jira pagination, rate-limit handling, retry/backoff behavior,
maximum issue limits, and partial-query recovery are out of scope for this
implementation. These operational safeguards do not need to be implemented in
v1.

**C-011 decision:** Jira pagination, rate limits, and partial query failure are
out of scope for v1.

### C-012: Define API delivery details — CLARIFIED

**Affected sections:** API Contract, Workflow, Non-Functional Requirements

The contract defines `POST /api/reports` but does not define CORS policy, client
base URL configuration, request size limits, content type, caching, correlation
IDs, or whether Markdown is returned inline versus through a download endpoint.

**Resolution:** v1 scope is limited to a local environment launched with
Docker. The React client MUST call the Express backend through the documented
HTTP API. The local client origin, API origin, CORS policy, JSON content type,
and generated artifact link MUST be documented by the implementation. No
production-origin, deployment, or external delivery contract is required for
this implementation.

**C-012 decision:** Use appropriate HTTP APIs for the local Docker-only launch;
production delivery details are out of scope for v1.

## Medium-Priority Gaps

### C-013: Clarify “at-risk” semantics — OUT OF SCOPE

**Affected sections:** FR-005, FR-007, User Stories

The report calls the section “In-Progress / At-Risk Items,” but the only defined
selection rule is status category `In Progress`. No schedule, age, due-date,
priority, blocked dependency, or risk threshold identifies an at-risk item.

**Resolution:** Risk calculation and at-risk classification are out of scope for
the current report. The v1 report MUST list in-progress items only; it MUST NOT
calculate, label, or display risk scores, risk signals, or at-risk classifications.

**C-013 decision:** Ignore risk calculation for the current report.

The current report ignores risk calculation entirely.

### C-014: Define status-count classification — OUT OF SCOPE

**Affected sections:** FR-009, API Contract

The response requires To Do, In Progress, and Done counts, but Jira has many
statuses and status-category mappings. It is unclear whether counts use
`statusCategory`, exact status names, the full project issue universe, or the
three query result sets.

**Resolution:** Status-count requirements are out of scope for the current
report. The v1 application MUST NOT calculate or expose To Do, In Progress,
Done, or other status counts as a report metric or API field.

**C-014 decision:** Ignore status-count requirements for v1.

### C-015: Define project-name retrieval — OUT OF SCOPE

**Affected sections:** FR-005, API Contract

The report header and response include project name, but the Jira query contract
only describes issue search. No project metadata endpoint, permission, fallback,
or missing-name behavior is specified.

**Resolution:** Project metadata lookup is out of scope for v1. The application
MUST NOT call a separate Jira project-details endpoint or require a project
name. The supplied Project Key is sufficient for report headers and API
responses.

**C-015 decision:** Ignore project metadata lookup requirements for v1.

No separate Jira project-details endpoint is required for v1.

### C-016: Define report formatting precisely — CLARIFIED

**Affected sections:** FR-005, FR-011, API Contract

The required section order is defined, but Markdown heading levels, list/table
format, date format, escaping of Jira summaries, issue-link format, rounding of
percentages, sorting, and generated-by text are not.

**Resolution:** The canonical report MUST contain these sections in order:

1. Header with the available Project Key, Report Date, week date range, and
   generation date. A separate project-name lookup is not required because of
   C-015.
2. Created User Stories and Bugs with the required Jira fields.
3. Completed This Week.
4. Blockers / Impediments, only when blockers exist.

The report MUST preserve the defined empty-state behavior for sections with no
matching data.

**C-016 decision:** Use the four-section report structure defined above.

C-016 status: CLARIFIED.

### C-017: Resolve filename and report-history collision behavior — CLARIFIED

**Affected sections:** FR-011, source specification, FR-012

The filename contains only the generation date. Multiple reports for the same
project on one day can collide. The source says runs must not overwrite prior
weeks, but does not define same-day behavior.

**Resolution:** Generated report filenames MUST use a UTC timestamp suffix. The
filename format is `status_report_<YYYY-MM-DD>_<HH-mm-ss>Z.md`, which preserves
the report date and prevents same-day filename collisions. Downloads and files
written under `server/reports/` MUST use the same filename.

**C-017 decision:** Use a timestamp suffix for every report filename.

C-017 status: CLARIFIED. Filename: `status_report_<YYYY-MM-DD>_<HH-mm-ss>Z.md`.

### C-018: Clarify error taxonomy and HTTP status mapping - OUT OF SCOPE

**Affected sections:** API Contract, FR-003, Test Strategy

Error codes are named, but HTTP status codes and retryability are not defined.
It is unclear whether invalid input is 400 or 422, missing configuration is 500
or 503, Jira authentication is 502 or 503, and database failure is retried.

**Resolution:** Detailed error taxonomy and HTTP status mapping requirements are
out of scope for this implementation. The v1 application does not require a
complete error matrix, stable retryability classification, or separate internal
error-code contract.

**C-018 decision:** Ignore detailed error taxonomy and HTTP status mapping
requirements for v1.

C-018 status: OUT OF SCOPE. Exact HTTP status mappings, retryability labels,
and detailed error taxonomy are not required for v1.

### C-019: Define health endpoint dependency semantics OUT OF SCOPE

**Affected sections:** API Contract, Constitution Principle VIII

`GET /api/health` may check only process liveness or required dependencies, but
no readiness/liveness distinction is defined. It is also unclear whether Jira
credentials or PostgreSQL must be reachable for a healthy response when
persistence is optional.

**Resolution:** Health endpoint dependency semantics are out of scope for this
implementation. The v1 application does not require separate liveness and
readiness endpoints or dependency checks for Jira and PostgreSQL.

**C-019 decision:** Ignore health endpoint dependency-semantics requirements
for v1.

C-019 status: OUT OF SCOPE. Separate liveness/readiness endpoints and
Jira/PostgreSQL dependency checks are not required for v1.

### C-020 OUT OF SCOPE

**Affected sections:** FR-013, Accessibility, Performance

The specification requires loading, empty, error, and success states but does
not define browser support, responsive breakpoints, clipboard behavior, download
fallback, cancellation, or what happens when the user starts a second report
for a different project.

**Resolution:** Detailed frontend interaction and browser-specific behavior are
out of scope for this implementation. The current scope is limited to a local
environment launched with Docker and supports general browsers. Responsive
breakpoints, request cancellation/replacement behavior, clipboard fallback, and
stale-result interaction rules are not required for v1.

**C-020 decision:** Use the local Docker launch and support general browsers;
ignore detailed frontend interaction and browser requirements for v1.

C-020 status: OUT OF SCOPE. Current scope is a local Docker launch with general
browser support.

### C-021: Database requirements OUT OF SCOPE

**Affected sections:** FR-012, Test Strategy, Constitution

The specification names PostgreSQL 15 and required report fields but does not
choose a database client/ORM, migration tool, schema constraints, indexes,
connection pooling, transaction boundaries, or local Docker environment
variables.

**Resolution:** Database requirements are out of scope for this implementation.
The v1 application MUST NOT require PostgreSQL, database access, database
migrations, schema definitions, persistence, or a database Docker service.

**C-021 decision:** Ignore all database requirements for v1.

C-021 status: OUT OF SCOPE. No PostgreSQL, database access, schemas, migrations,
persistence, or database Docker service is required for v1.

### C-022 CLARIFIED

**Affected sections:** FR-003, FR-012, Operational requirements

Required environment variables are named indirectly, but there is no complete
configuration table, validation timing, default policy, or behavior when optional
PostgreSQL settings are absent.

**Resolution:** The current scope is a local environment launched with Docker.
The web application MUST use environment variables from `.env` through
appropriate client and server configuration files. Real secrets MUST remain in
the local ignored `.env`; `.env.example` MUST document placeholders only.
Required configuration MUST be validated at server startup, and invalid
required configuration MUST prevent report generation with a safe error.

**C-022 decision:** Use `.env` and appropriate configuration files for the
Docker-local web application launch.

C-022 status: CLARIFIED. Docker-local environment, `.env` variables, startup
validation, VITE_ variables, and safe configuration errors are defined for v1.

## Lower-Priority Gaps

### C-023: Clarify the generated-by field

The source report requires a generated-by/date stamp, but the application
specification only says the header contains a generation date. Define whether
“generated by” is a fixed application label, authenticated user, service name,
or omitted from v1.

### C-024 CLARIFIED

**Resolution:** The v1 report MUST be generated in Markdown format only. The
canonical artifact, download, and report preview source MUST be Markdown; no
HTML, PDF, or other report document format is required.

Jira summaries and other dynamic values MUST be safely escaped for Markdown.

**C-024 decision:** Generate the report in Markdown format only.

C-024 status: CLARIFIED. The report is Markdown format only, with safe Markdown
escaping for dynamic values.

### C-025: Define observability requirements

The constitution requires actionable logs, but the specification does not
identify structured logging, log levels, correlation IDs, metrics, audit events,
or redaction tests. Define the minimum production diagnostics expected in v1.

### C-026: Define rate and retention limits for sensitive reports

Report content is described as potentially sensitive, but there is no retention,
delete/export, access logging, or maximum report-size policy. This is especially
important if PostgreSQL persistence is enabled.

### C-027: Define dependency and lockfile policy

The specification requires exact dependency versions or an approved lockfile,
but does not state whether npm lockfiles are mandatory, how updates are
reviewed, or which Node/npm versions CI must use.

### C-028: Define test coverage and CI gates

The test categories are listed, but minimum coverage, test command names, CI
platform, lint configuration, and whether frontend/backend tests run separately
are unspecified.

## Cross-Document Contradictions

1. **Python CLI versus Node/Express app:** The source specification's execution
   model is Python/manual, while the app specification's workflow is browser/API
   based. See C-001.
2. **Report output location:** The source uses `work/module03-task/reports/`,
   while the app convention uses `server/reports/`. See C-001.
3. **Optional persistence versus mandatory persistence language:** Persistence
   is conditional, but report IDs, non-overwriting history, database errors, and
   migration tests appear in the main contract. See C-004.
4. **RAG definition versus RAG scenarios:** The source definition of expected
   pace does not yield the threshold behavior described by the acceptance
   scenarios. See C-002.
5. **Current-state queries versus weekly metrics:** In-progress and blocked
   queries have no seven-day restriction, while the product is described as a
   weekly report and metrics need a defined project scope. See C-003.
6. **Exact-version requirement versus unresolved Vite/Express versions:**
   Resolved by C-005; Vite 7.1.7 and Express 5.1.0 are pinned in the package
   manifests, and Docker 29.7.2 is local verification only.

## Recommended Clarification Order

1. Define the issue universe, query windows, deduplication, metrics, and RAG
   data source (C-003).
2. Resolve API operational behavior (C-021).
3. Publish the Markdown template and collision policy (C-017).
4. Define CI and observability policies (C-025, C-027, C-028).
