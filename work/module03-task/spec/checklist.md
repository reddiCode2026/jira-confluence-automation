# Status Report App Requirements Checklist

## Review Context

- **Specification reviewed:** `work/module03-task/spec/specification.md`
- **Implementation reviewed:** `work/status-report-app/`
- **Runtime checked:** Docker client/API are running locally; `/` and `/api/health`
  return HTTP 200.
- **External prerequisite:** Live report generation requires valid Jira credentials
  in `work/status-report-app/server/.env`. The current configured credentials
  return Jira HTTP 401, so live Jira data cannot be verified in this environment.
- **Specification path discrepancy:** `work/status-report-app/spec/specification.md`
  is absent; the specification copy reviewed here is under
  `work/module03-task/spec/`.

Status meanings:

- **Implemented:** Code or configuration exists and is aligned with the requirement.
- **Implemented / external check:** Code exists; verification depends on Jira or
  another external prerequisite.
- **Partial:** Some behavior exists, but the full requirement is not covered.
- **Not applicable:** Explicitly excluded from v1.
- **Not verified:** Requirement exists but has no executable evidence yet.

## Identity and Stack

| Requirement | Status | Evidence / notes |
|---|---|---|
| Project name is `status-report-app` | Implemented | Specification identity and package names. |
| Project purpose and target users | Implemented | Project Manager and stakeholder workflow are documented. |
| React 18 frontend | Implemented | Client manifest pins React 18.3.1. |
| Vite frontend | Implemented | Vite 7.1.7 and Vite config are present. |
| Node.js 24.21.0 | Implemented | Client/server engine declarations and Docker base image. |
| Express 5.1.0 | Implemented | Server manifest and Express entry point. |
| Docker-local launch | Implemented / external check | Dockerfiles and Compose exist; images build and services start. |
| No database for v1 | Implemented | Compose has no database service and server is filesystem-based. |
| Jira Cloud REST API v3 | Implemented / external check | Server-side Jira client exists; credentials currently receive 401. |

## Functional Requirements

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| FR-001 | Project Key and Report Date inputs; `EPMCDMETST` fallback; validation | Implemented | React form and server controller apply the default and accept ISO dates. Legacy `DD-MM-YYYY` input is normalized client-side. |
| FR-002 | UTC rolling seven-day window | Implemented | `dateUtils.js` creates UTC start/end values from Report Date. |
| FR-003 | Server-side Jira authentication and safe failures | Implemented / external check | Jira client uses server credentials; secrets stay server-side. Live auth is blocked by configured Jira 401. |
| FR-004 | Canonical Created-date Story/Bug query and required Jira fields | Implemented / external check | Jira client requests report fields and report service normalizes them. Live query cannot complete with invalid credentials. |
| FR-005 | Exactly four Markdown sections in order | Implemented | Renderer emits Header, Created User Stories and Bugs, Completed This Week, and conditional Blockers / Impediments. |
| FR-006 | Created items and completed items | Implemented / external check | Normalized issues populate created/completed sections; live Jira data is credential-dependent. |
| FR-007 | Blocker detection | Implemented / external check | Flagged/blocked-label logic is represented in normalization/service flow; live data is credential-dependent. |
| FR-008 | Point metrics with no status-count output | Implemented | `StoryPoints` normalization and point aggregation are present; status-count output is omitted. |
| FR-009 | Not used as a numbered requirement in current specification | Not applicable | Current document jumps from FR-008 to FR-010 after clarified scope changes. |
| FR-010 | Internal RAG calculation only; no health report/API output | Partial | Report service and renderer omit health/metrics output, but the current service path does not yet expose a complete tested RAG domain implementation. |
| FR-011 | Markdown-only output, UTC timestamp filename, download | Implemented | Markdown renderer, timestamp filename, filesystem write, and report URL are implemented. |
| FR-012 | Stateless filesystem execution; no database | Implemented | Reports write to `server/reports`; no persistence/database service exists. |
| FR-013 | Loading, success, empty, validation, Jira/server error states | Partial | React loading/error/success flow exists; full empty-state and section-level UI coverage is not verified. |

## API Contract

| Requirement | Status | Evidence / notes |
|---|---|---|
| `POST /api/reports` accepts Project Key and Report Date | Implemented | Express route/controller are wired. |
| Success response has project key and UTC window | Implemented | Controller returns project/window data. |
| Success response has created/completed/blocker sections | Implemented | Controller returns the four section collections. |
| Success response has Markdown and report URL | Implemented | Controller returns Markdown and `/reports/<filename>`. |
| Success response omits `health` and `metrics` objects | Implemented | Current response shape excludes both objects. |
| Report URL resolves to `server/reports` artifact | Implemented | Express static report serving and Compose volume are configured. |
| JSON content type and local CORS | Implemented | Express JSON middleware and localhost CORS are configured. |
| Safe error response | Implemented | Missing configuration, invalid date, and Jira auth errors are classified. |
| `GET /api/health` process check | Implemented | Local health endpoint returns HTTP 200. |

## Data Model and Security

| Requirement | Status | Evidence / notes |
|---|---|---|
| Required normalized issue fields | Implemented | `normalizeIssue` maps key, project, type, summary, status, assignee, dates, reporter, StoryPoints, and blocker state. |
| Jira custom StoryPoints field `cf[10004]` | Implemented | Jira service reads `customfield_10004`. |
| Deduplication by Jira key | Implemented | Report service removes duplicate issue keys. |
| Missing StoryPoints excluded from point sums | Implemented | Null StoryPoints are retained for listings and excluded from numeric sums. |
| Secrets server-only | Implemented | Jira client is server-side; client receives no credentials. |
| `.env.example` placeholders | Implemented | Server example file exists. |
| Real `.env` ignored | Not verified | Current `.gitignore` status should be checked before release. |
| Markdown escaping | Implemented | Renderer escapes dynamic values before output. |
| Path traversal protection | Partial | Static serving exists; filename generation is controlled, but dedicated traversal tests are not verified. |

## Acceptance Scenarios

| Scenario | Status | Evidence / notes |
|---|---|---|
| A: Successful report with blockers | Implemented / external check | Local route/renderer exists; live Jira success is blocked by HTTP 401 credentials. |
| B: No blockers / Green pace | Partial | Requires a completed RAG calculation and mocked fixtures; no live verification. |
| C: Below pace / Amber | Partial | Requires a completed RAG calculation and mocked fixtures; no live verification. |
| C1: Missing point data / Unavailable | Partial | Specification and task criteria exist; executable coverage is not verified. |
| C2: Done/all-item point formulas | Implemented / not fully tested | Formula is represented in the service plan and normalization, but executable test coverage is incomplete. |
| D: Empty query results | Partial | Renderer supports empty lists; full API/UI behavior is not verified. |
| D1: Seven-day canonical scope | Partial | Query and normalization logic exist; live and integration proof is unavailable. |
| E: Jira authentication failure | Implemented | Live request returns the safe Jira authentication failure path. |
| F: Invalid input | Implemented | Controller/date utility reject invalid input; client validation is basic. |
| G: Missing StoryPoints | Implemented / not fully tested | Normalization preserves the issue and omits it from point sums. |
| H: Zero points | Partial | Guarded by specification/service intent; automated test evidence is incomplete. |
| I: Credential boundary | Implemented | Credentials are read only by server-side configuration/client. |
| J: Timestamped download | Implemented | Timestamped filename and report URL are returned. |

## Non-Functional Requirements

| Area | Status | Evidence / notes |
|---|---|---|
| Security and secret redaction | Partial | Server boundary is correct; final log/redaction tests are not verified. |
| Reliability and no partial files | Partial | Filesystem path exists; atomic-write and failure cleanup tests are not verified. |
| Performance target | Not verified | No performance test or measurement is present. |
| Accessibility | Partial | Semantic form labels exist; keyboard/contrast/browser checks are not verified. |
| Maintainability boundaries | Implemented | Client API service, server services, controller, route, and template modules exist. |
| Docker local launch | Implemented | Compose config resolves and client/server images build. |
| General browser support | Not verified | Browser smoke page opens; broader browser matrix is not tested. |

## Test and Artifact Checklist

| Artifact / capability | Status | Notes |
|---|---|---|
| Client/server package manifests | Implemented | Pinned manifests exist. |
| Client/server lockfiles | Implemented | Generated during dependency installation. |
| Client Dockerfile | Implemented | Image builds. |
| Server Dockerfile | Implemented | Image builds. |
| Docker Compose | Implemented | Client/server ports, healthcheck, and reports volume configured. |
| Functional report API | Implemented / external check | Route exists; live Jira request is credential-blocked. |
| Jira fixtures and adapter tests | Not verified | Test files exist but executable coverage is incomplete. |
| Frontend workflow tests | Not verified | No confirmed test runner/browser harness. |
| README setup instructions | Not verified | Documentation completeness requires review. |
| CI/lint/format configuration | Not verified | No confirmed CI quality gate. |

## Final Assessment

The implementation is structurally aligned with the specification and Docker
launches successfully. The main remaining verification boundary is external Jira
authentication: the configured credentials currently return HTTP 401. The next
release check should use valid Jira credentials and execute the full report flow,
then run the automated API/domain/frontend test suite.
