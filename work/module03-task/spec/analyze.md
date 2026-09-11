# Task Analysis

## Review Summary

The task list now covers the complete Docker-local React/Express delivery path,
but implementation readiness still depends on wiring the existing scaffold into
the specified report workflow. The main risks are Jira query-universe
consistency, report generation versus the four-section output contract, and
missing executable test/tooling artifacts.

Complexity levels:

- **Low:** Isolated configuration or deterministic utility work.
- **Medium:** Cross-module work with a bounded integration surface.
- **High:** External Jira, Docker, filesystem, or full-stack integration work.

## Task-by-Task Assessment

| ID | Complexity | Dependencies | Primary risks |
|---|---|---|---|
| T-001 | Low | None | Version or lockfile drift. |
| T-002 | Low | None | Express scripts and test command are not yet defined. |
| T-003 | Low | T-001 | Vite entry-point and plugin configuration. |
| T-004 | Medium | T-002 | Express route and error middleware wiring. |
| T-005 | Medium | T-004 | Secret exposure and startup/request validation boundaries. |
| T-006 | High | T-003, T-004, T-005 | Docker networking, build-time Vite variables, CORS, and service readiness. |
| T-007 | Medium | T-004, T-005 | Project-key precedence and UTC date validation. |
| T-008 | Medium | T-004, T-006 | JSON/CORS behavior differing between local and container execution. |
| T-009 | Medium | T-004, T-005, T-007 | Safe errors without losing useful diagnostics. |
| T-010 | Medium | T-007, T-008 | API shape drift and report URL semantics. |
| T-011 | Medium | T-007 | UTC window boundary behavior. |
| T-012 | High | T-005, T-011 | Jira authentication, field selection, custom field `cf[10004]`, and upstream failures. |
| T-013 | High | T-011, T-012 | Canonical Created-date universe versus derived status filters. |
| T-014 | High | T-013 | Jira mapping, null handling, status-category normalization, and deduplication. |
| T-015 | Medium | T-014 | `status = Done` semantics and blocker classification. |
| T-016 | Medium | T-014, T-015 | Correct Done-only and all-report-item StoryPoints sums. |
| T-017 | Low | T-015, T-016 | Ensuring no health, RAG, or metrics output leaks into the four-section contract. |
| T-018 | High | T-014, T-015, T-016, T-017 | Exact Markdown order, escaping, empty states, and output omissions. |
| T-019 | Low | T-018 | UTC timestamp precision and filename collision behavior. |
| T-020 | Medium | T-018, T-019 | Atomic writes, safe URL serving, and path traversal. |
| T-021 | Medium | T-007, T-010 | Form defaults, date input, and client API boundary. |
| T-022 | Medium | T-010, T-020, T-021 | Preview/download URL consistency. |
| T-023 | Medium | T-021, T-022 | Loading, stale state, duplicate submission, and safe error states. |
| T-024 | High | T-014, T-016, T-017, T-018 | Broad fixture coverage across Jira and Markdown rules. |
| T-025 | Medium | T-009, T-010, T-021, T-023 | Missing test runner and browser/API mocking decisions. |
| T-026 | High | T-006, T-020, T-023, T-024, T-025 | Full Docker flow, env injection, networking, and URL download verification. |
| T-027 | Low | T-026 | README and command drift. |
| T-028 | Medium | T-024, T-025, T-026, T-027 | Cross-document scope and release-gate consistency. |

## High-Risk Dependency Chains

### Jira-to-Markdown

`T-011 -> T-012 -> T-013 -> T-014 -> T-015 -> T-016 -> T-017 -> T-018`

The canonical Jira Created-date universe, custom field mapping, status-category
filtering, and deduplication must be settled before rendering or tests can be
trusted.

### Docker-to-API-to-UI

`T-005 -> T-006 -> T-008 -> T-010 -> T-021 -> T-022 -> T-026`

Vite variables are client-visible build/runtime configuration, while Jira
secrets must remain server-only. Container networking and report URL serving
must be tested together.

## Current Gaps and Contradictions

### G-001: Four-section contract versus residual domain language

The task list now correctly treats T-017 as four-section verification, but the
specification still describes RAG and metrics as backend calculations while the
API and Markdown exclude health/metrics output. Decide and document that these
are internal calculation inputs only, not report sections or API response
objects.

**Impact:** T-010, T-017, T-018, T-022, T-023, T-028.

### G-002: Canonical report universe must remain singular

The clarified tasks define `committedPoints` from all user stories and bugs
filtered by Jira Created date. The implementation must not merge an independent
unbounded Completed/In Progress/Blocked query set into that universe. Those
filters must operate on the normalized canonical dataset.

**Impact:** T-013, T-014, T-016, T-024.

### G-003: Existing Docker scaffold is not yet feature-complete

The current Docker scaffold includes Dockerfiles, Compose, Vite config, React
entry points, and a basic Express health endpoint. The `POST /api/reports`
implementation is still missing, along with the Jira integration, environment
validation, filesystem serving, and production UI flow.

**Impact:** T-005, T-010, T-012, T-020, T-021, T-022.

### G-004: Lockfiles and test tooling are missing

The package manifests are pinned, but lockfiles, test scripts, test runners, and
browser/API mocking configuration are not established as executable artifacts.

**Impact:** T-001, T-002, T-024, T-025, T-028.

### G-005: Report URL serving needs one implementation decision

Compose mounts `server/reports`, but the Express application must either serve
that directory safely or the client must construct a download from returned
Markdown. The tasks now require a served URL; implement and test that choice.

**Impact:** T-010, T-020, T-022, T-026.

### G-006: Docker environment is defined but not fully documented

The current Compose setup starts client and server services on ports 5173 and
3000 and mounts reports. README instructions, `.env` setup, and a real report
smoke path are still missing.

**Impact:** T-006, T-026, T-027.

### G-007: Constitution drift remains

The constitution still describes PostgreSQL, persistence, and database-access
architecture, while the clarified v1 specification and tasks exclude databases.
This must be resolved before T-028 release review.

**Impact:** T-028.

### G-008: Source specification status is ambiguous

The implementation boundary is the Docker-local web application, but the
specification still references the Python source document. Mark that document
as historical/reference-only or explicitly define its traceability role.

**Impact:** T-028.

## Missing or Incomplete Artifacts

- `client/package-lock.json`.
- `server/package-lock.json`.
- Functional `POST /api/reports` route/controller implementation.
- Jira adapter tests and fixtures.
- `server/src/config/environment.js` implementation and populated `.env.example`.
- Safe static report serving from `server/reports/`.
- Functional frontend form, preview, and error states.
- Test runner scripts and browser/API mocking setup.
- `.gitignore` rules for `.env`, dependencies, build output, reports, and caches.
- README Docker and local configuration instructions.
- CI, lint, and formatting configuration.

## Recommended Improvements

1. Resolve the canonical Jira dataset algorithm before implementing T-013.
2. Add lockfiles and executable test scripts before T-024/T-025.
3. Implement the report API and filesystem URL serving before frontend download work.
4. Add a real mocked report smoke test to T-026.
5. Synchronize the constitution with the no-database v1 scope.
6. Mark the Python source specification as historical/reference-only.
7. Add a release checklist mapping each acceptance scenario to a test.
# Task Analysis

## Summary

The task breakdown is well ordered and covers the main v1 delivery path, but it
is not fully implementation-ready. The largest risks are the contradiction
between the clarified four-section report and the remaining health/metrics
language, the unresolved `committedPoints` source, and the mismatch between the
canonical issue universe and the additional Jira queries.

Complexity levels:

- **Low:** Local configuration or isolated implementation with limited
  integration risk.
- **Medium:** Cross-module work or external-contract behavior with manageable
  test coverage.
- **High:** External integration, cross-layer behavior, or a decision that can
  invalidate downstream work.

## Task-by-Task Assessment

| ID | Complexity | Dependencies | Primary risks |
|---|---|---|---|
| T-001 | Low | None | Version compatibility, lockfile drift, Node/npm engine mismatch. |
| T-002 | Low | None | Express 5 middleware behavior and missing server test script. |
| T-003 | Low | T-001 | Vite/plugin configuration and React entry-point assumptions. |
| T-004 | Medium | T-002 | Route/error middleware ordering and startup behavior. |
| T-005 | Medium | T-004 | Secret leakage, startup-vs-request validation ambiguity, client/server env exposure. |
| T-006 | High | T-003, T-004, T-005 | Docker networking, build-time Vite variables, port/CORS mismatch, missing Docker artifacts. |
| T-007 | Medium | T-004, T-005 | Project-key precedence, UTC date validation, future-date policy. |
| T-008 | Medium | T-004, T-006 | CORS origin mismatch and JSON/body-parser configuration. |
| T-009 | Medium | T-004, T-005, T-007 | Safe error details versus useful diagnostics; no status taxonomy in v1. |
| T-010 | Medium | T-007, T-008 | API shape drift, generated-file link semantics, omitted health/metrics fields. |
| T-011 | Medium | T-007 | Inclusive/exclusive window semantics remain intentionally deferred. |
| T-012 | High | T-005, T-011 | Jira auth, request construction, field IDs, timeouts, and upstream failures. |
| T-013 | High | T-011, T-012 | Canonical issue universe versus separate completed/in-progress/blocker queries. |
| T-014 | High | T-013 | Jira field mapping, null handling, deduplication, and status normalization. |
| T-015 | Medium | T-014 | Done semantics, blocker signals, and keeping all classifications inside the window. |
| T-016 | Medium | T-014, T-015 | Correct StoryPoints field, Done filtering, all-item committed sum, zero values. |
| T-017 | Medium | T-015, T-016 | Blocker precedence and Unavailable pace behavior. |
| T-018 | High | T-014 through T-017 | Exact four-section contract, escaping, empty sections, and Markdown snapshots. |
| T-019 | Low | T-018 | UTC timestamp precision and same-second filename collisions. |
| T-020 | Medium | T-018, T-019 | Atomic writes, path traversal, static file serving, and artifact links. |
| T-021 | Medium | T-007, T-010 | Form state, default Project Key, API client boundary, and date input behavior. |
| T-022 | Medium | T-010, T-020, T-021 | Preview/download consistency and generated-file URL behavior. |
| T-023 | Medium | T-021, T-022 | Stale state, duplicate submissions, and safe error presentation. |
| T-024 | High | T-014, T-016 through T-018 | Broad domain coverage and fixture maintenance across Jira/report rules. |
| T-025 | Medium | T-009, T-010, T-021, T-023 | Test framework selection and reliable browser/API mocking. |
| T-026 | High | T-006, T-020, T-023 through T-025 | Full Docker integration, env injection, networking, and artifact verification. |
| T-027 | Low | T-026 | Documentation drift from actual commands and ports. |
| T-028 | Medium | T-024 through T-027 | Cross-document consistency and scope leakage before release. |

## High-Risk Dependency Chains

### Jira-to-report chain

`T-011 -> T-012 -> T-013 -> T-014 -> T-015 -> T-016 -> T-017 -> T-018`

Any ambiguity in the canonical Jira universe or field mapping propagates into
metrics, RAG, Markdown, frontend output, and tests. Resolve query scope before
building the renderer.

### Docker-to-frontend chain

`T-005 -> T-006 -> T-008 -> T-010 -> T-021 -> T-022 -> T-026`

Vite environment variables are build-time concerns, while Jira secrets are
server-only runtime concerns. Treating both as generic `.env` values can expose
credentials or produce a client pointing at the wrong API origin.

## Gaps and Contradictions

### G-001: Four-section report versus residual health/metrics behavior

The specification defines exactly four Markdown sections and removed `health`
and `metrics` from the API response, but the goals, user stories, RAG section,
acceptance scenarios B/C, and several tasks still describe health/metrics as
user-visible report behavior. Decide whether RAG and metrics are internal
calculation inputs only or whether they should appear in the UI outside the
Markdown sections.

**Impact:** T-010, T-017, T-018, T-022, T-023, T-028.

### G-002: `committedPoints` source is still underspecified

The formula says committed points equal all StoryPoints in the report universe,
but the specification also calls the report universe Story/Bug items filtered by
Created date and separately describes completed/in-progress/blocker queries.
There is no single implementation rule for combining or deduplicating those
queries before calculating the sum.

**Impact:** T-013, T-014, T-016, T-024.

### G-003: Query requirements conflict with clarified scope

FR-004 defines a canonical issue universe, then requires separate Completed,
In Progress, and Blocked JQL queries. Those queries can return different sets
unless they are explicitly intersected with the canonical universe. The tasks
say they are scoped, but the specification should state the exact query or
post-filter algorithm.

**Impact:** T-013, T-015, T-018.

### G-004: Missing Docker artifacts in the repository

The plan and tasks require Docker launch, but no Dockerfile or orchestration
file is listed in the current project structure. The specification does not
name a `docker-compose.yml`, Compose version, service names, build contexts,
volume behavior, or report-file serving configuration.

**Impact:** T-006, T-026, T-027.

### G-005: Lockfiles and scripts are not present yet

The task plan requires committed lockfiles and runnable scripts, but the
manifests were previously empty and the specification does not define exact
script names beyond the plan. CI cannot be reproduced until these artifacts
exist.

**Impact:** T-001, T-002, T-027, T-028.

### G-006: Artifact URL contract is incomplete

The API returns a report URL, but the specification does not define how
Express serves `server/reports/`, whether the URL is public within the local
app, path normalization rules, or how a downloaded file is protected from
path traversal.

**Impact:** T-010, T-020, T-022, T-026.

### G-007: No concrete Jira StoryPoints field identifier

The specification names `StoryPoints`, but Jira installations commonly expose
story points through a custom field ID. The adapter task cannot be implemented
reliably without the configured field identifier or field-discovery rule.

**Impact:** T-012 through T-016.

### G-008: Done and blocker status semantics need exact mapping

The specification alternates between exact Jira status `Done` and
`statusCategory = Done`. It also uses current blocker fields while requiring the
same seven-day universe. Define whether normalization uses exact status,
status category, or both.

**Impact:** T-013 through T-017.

### G-009: Test infrastructure artifacts are unspecified

The tasks require client, server, API, adapter, snapshot, and frontend tests,
but the specification does not select test runners, assertion libraries, browser
harnesses, coverage thresholds, or test commands.

**Impact:** T-024, T-025, T-028.

### G-010: Static report serving is implied but not specified

The API returns a file URL and the UI must download it, but no requirement says
whether Express serves `server/reports` statically or whether the client creates
a Blob from returned Markdown. Choose one approach and test it.

**Impact:** T-020, T-022, T-026.

### G-011: Constitution is not synchronized with v1 scope

The constitution still describes PostgreSQL, persistence, database access, and
optional Docker database behavior as active architecture principles. The current
specification says no database is required for v1. The implementation plan and
tasks follow the specification, so constitution/specification drift remains.

**Impact:** T-028 and governance review.

### G-012: Source document is stale relative to clarified app behavior

The specification still references the Python source report and its old output
semantics, while C-001 makes the web app the v1 implementation boundary. Mark
the source document as historical/reference-only or update the traceability
language.

**Impact:** T-028 and future maintenance.

## Missing Artifacts

Before implementation is complete, add or confirm these artifacts:

- `client/package-lock.json`.
- `server/package-lock.json`.
- `client/vite.config.js`.
- `client/src/main.jsx` and `client/src/App.jsx`.
- `server/src/app.js`.
- `server/src/config/environment.js` or equivalent configuration module.
- `server/.env.example`.
- Dockerfile for the client.
- Dockerfile for the server.
- Docker Compose/orchestration file.
- Report directory serving or download implementation.
- Jira adapter module and mocked Jira fixtures.
- Normalized issue model/types or documented object contract.
- Domain calculation modules for point metrics and RAG.
- Markdown template/renderer module.
- Filesystem writer with atomic failure behavior.
- Client API service module.
- Frontend form, preview, and error-state components.
- API, adapter, domain, Markdown, and frontend tests.
- README setup and Docker instructions.
- CI/lint/format configuration and runnable commands.

## Recommended Improvements

1. Resolve G-001 through G-003 before implementing T-013 and T-018.
2. Add Docker and lockfile artifacts before starting the frontend workflow.
3. Specify the Jira StoryPoints field ID and exact status mapping.
4. Add a test-tooling decision to the specification or plan.
5. Synchronize the constitution with the no-database v1 boundary.
6. Mark `project_spec.md` as a historical source document for v1.
7. Add explicit atomic-write and file-serving security requirements.
8. Add a release checklist mapping every acceptance scenario to a test.
