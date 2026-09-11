# Status Report App Implementation Plan

## Plan Summary

This plan implements the clarified v1 specification for `status-report-app`:

- React 18 + Vite frontend.
- Node.js 24.21.0 + Express 5.1.0 backend.
- Jira Cloud REST API v3 integration.
- Docker-local launch only.
- No database, persistence, authentication, pagination strategy, rate-limit
  handling, or advanced frontend interaction requirements in v1.
- Markdown-only report output written to `server/reports/`.
- Exactly four report sections: Header, Created User Stories and Bugs,
  Completed This Week, and Blockers / Impediments.

## Delivery Principles

1. Implement the backend domain rules before the UI so the report is calculated
   in one place.
2. Keep Jira credentials server-side and use mocked Jira responses in tests.
3. Keep the v1 implementation stateless and filesystem-based.
4. Make every milestone independently runnable and verifiable.
5. Do not introduce deferred capabilities without a specification change.

## Phase 0: Baseline and Scaffolding

### Objectives

Establish the repository structure, pinned dependencies, Docker launch contract,
and development quality gates.

### Tasks

- Confirm the client and server package manifests:
  - React `18.3.1` and React DOM `18.3.1`.
  - Vite `7.1.7` and React Vite plugin `5.0.4`.
  - Express `5.1.0`.
  - Node.js `24.21.0` and npm `11.19.0` engine requirements.
- Add and commit client/server lockfiles.
- Add Vite configuration and React entry files.
- Add the Express application entry point and route registration.
- Add `server/src/config/` with environment loading and validation.
- Add `server/.env.example` with placeholders only.
- Add Dockerfiles and the local Docker orchestration needed to start the client
  on `localhost:5173` and the API on `localhost:3000`.
- Add scripts for development, build, test, and Docker startup.
- Ensure real `.env` files and generated reports are ignored appropriately.

### Milestone M0: Local skeleton runs

The React client and Express server start through Docker, configuration errors are
reported safely, and a basic process health check is available if implemented.

### Exit Criteria

- Docker starts both services.
- No secret is present in tracked files or client assets.
- Client and server manifests match the specification.
- A basic automated test command runs successfully.

## Phase 1: Configuration and API Foundation

### Objectives

Create the server-side request boundary and the minimal local API contract.

### Tasks

- Implement `POST /api/reports` request validation for:
  - `projectKey`, defaulting to `EPMCDMETST` when omitted.
  - `reportDate`, interpreted in UTC.
- Implement safe error handling for invalid input, missing configuration, Jira
  authentication failure, Jira upstream failure, and unexpected server failure.
- Configure local CORS for `http://localhost:5173`.
- Accept and return JSON with `Content-Type: application/json`.
- Configure the client API base URL through `VITE_API_BASE_URL`.
- Define the response shape containing project key, reporting window, sections,
  Markdown, and generated report file link.
- Do not add user authentication, authorization, database status, or detailed
  HTTP error taxonomy in v1.

### Milestone M1: API contract is executable

A mocked request can pass through validation and return a stable success or safe
error response without contacting a live Jira instance.

### Exit Criteria

- Request validation works on both client and server boundaries.
- Required configuration is validated at server startup.
- API tests cover success, invalid input, and safe configuration errors.

## Phase 2: Jira Integration and Normalization

### Objectives

Retrieve the canonical Jira issue universe and map provider data into the
internal issue model.

### Tasks

- Implement a server-side Jira API client using:
  - `JIRA_SITE_URL`.
  - `JIRA_EMAIL`.
  - `JIRA_API_TOKEN`.
- Build the UTC rolling seven-day window from the user-supplied Report Date.
- Query user stories and bugs using the Project Key and Jira `Created` field.
- Apply current blocker fields within the same canonical report window.
- Retrieve the fields required by the report:
  - project, key, issuetype, summary, status, assignee, created, reporter;
  - StoryPoints when available;
  - resolved information when needed for completed items;
  - blocker indicators.
- Normalize Jira field names to the internal issue model.
- Deduplicate results by Jira issue key.
- Exclude unavailable StoryPoints only from point calculations; retain the issue
  for applicable listings.
- Keep Jira pagination and rate-limit strategies out of v1 scope as specified.

### Milestone M2: Deterministic normalized dataset

Mocked Jira responses produce one deduplicated, UTC-bounded internal dataset with
stable fields and no credentials in logs or output.

### Exit Criteria

- Jira adapter tests cover valid responses and ordinary non-2xx failures.
- Created, completed, and blocker filtering is deterministic.
- Duplicate issue keys are counted once.
- Missing StoryPoints behavior is tested.

## Phase 3: Report Domain and Markdown Renderer

### Objectives

Implement the report calculations and canonical four-section Markdown output.

### Tasks

- Implement `completedPoints` as the sum of StoryPoints for report-universe Jira
  items with status `Done`.
- Implement `committedPoints` as the sum of StoryPoints for all report-universe
  Jira items, regardless of status.
- Exclude missing or unusable StoryPoints from both sums.
- Point formulas:
  - `completedPoints = sum(StoryPoints where status = Done)`.
  - `committedPoints = sum(StoryPoints for every item in the report universe)`.
  - `pace = completedPoints / committedPoints` when `committedPoints > 0`.
- Implement RAG precedence:
  1. Any blocker produces Red.
  2. Otherwise, calculate `completedPoints / committedPoints`.
  3. Below 70% produces Amber.
  4. At or above 70% produces Green.
  5. Missing or zero committed points produces Unavailable pace without
     inferring Amber or Green.
- Render exactly these Markdown sections in order:
  1. Header with Project Key, Report Date, date range, and generation date.
  2. Created User Stories and Bugs with required Jira fields.
  3. Completed This Week.
  4. Blockers / Impediments only when blockers exist.
- Render explicit `None` placeholders for empty created/completed sections.
- Escape dynamic Jira content safely for Markdown.
- Generate filenames using UTC:
  `status_report_<YYYY-MM-DD>_<HH-mm-ss>Z.md`.
- Do not render HTML, PDF, status-count metrics, blocker duration, or risk
  classifications.

### Milestone M3: Golden Markdown report

Given a fixed normalized dataset, the renderer produces a deterministic Markdown
file with the exact four-section order and correct point formulas.

### Exit Criteria

- Unit tests cover RAG branches, point aggregation, zero denominators, empty
  sections, escaping, filename generation, and Markdown structure.
- Snapshot or structural tests verify section order.
- Generated output contains no secrets or unsupported format.

## Phase 4: Filesystem Output and Frontend Workflow

### Objectives

Connect the domain service to the React workflow and provide local preview and
download behavior.

### Tasks

- Write successful reports to `server/reports/`.
- Return the generated artifact path/link from the API.
- Build the Project Key and Report Date form.
- Prefill Project Key with `EPMCDMETST` when needed.
- Show loading, validation, success, empty, Jira failure, configuration error,
  and server-error states.
- Display the Markdown preview and generated file link.
- Provide Markdown download/copy actions.
- Prevent duplicate submissions while generation is active.
- Keep Jira credentials and authorization data out of the browser.
- Keep components presentation-focused and delegate API calls to client service
  modules.

### Milestone M4: Complete local user flow

A Project Manager can enter a Project Key and Report Date, generate a report
through Docker, view the Markdown preview, and download the timestamped file.

### Exit Criteria

- Frontend tests cover form submission, loading, success, empty, error, and
  download states.
- The UI presents the four report sections consistently.
- A failed request never offers a partial report.

## Phase 5: Integration, Docker Verification, and Release Readiness

### Objectives

Verify the complete local system and prepare the implementation for review.

### Tasks

- Run client build and server startup through Docker.
- Test the complete mocked or configured Jira flow.
- Verify `.env` validation and secret redaction.
- Verify generated files use UTC timestamp-suffix names.
- Verify no database service, migration, or persistence dependency exists.
- Run unit, API, frontend, and Markdown structural tests.
- Run formatting and lint checks when configured.
- Update README setup instructions and Docker commands.
- Confirm the implementation stays within v1 scope.

### Milestone M5: V1 release candidate

The application launches locally through Docker and produces a correct Markdown
report from a valid Jira configuration without requiring a database or user
authentication.

### Exit Criteria

- Docker-local smoke test passes.
- Automated test suite passes.
- No tracked secrets or generated cache artifacts are introduced.
- Specification, implementation, tests, and setup documentation agree.

## Suggested Implementation Order

1. Configuration validation and Docker skeleton.
2. Express API request boundary.
3. Jira adapter and normalized issue model.
4. Point metrics and RAG domain service.
5. Markdown renderer and filesystem writer.
6. React form, preview, errors, and download.
7. Integration tests, Docker smoke test, and documentation.

## Deferred Work

The following are explicitly excluded from v1 and require a future specification
revision:

- Database persistence, schemas, migrations, and report history.
- User authentication and authorization.
- Jira pagination and rate-limit/retry strategies.
- Detailed HTTP status/error taxonomy.
- Project metadata lookup.
- Blocker duration and Jira changelog analysis.
- Risk and at-risk classification.
- Status-count metrics.
- HTML, PDF, or other report formats.
- Production deployment and production CORS configuration.
- Advanced browser-specific interaction behavior.
