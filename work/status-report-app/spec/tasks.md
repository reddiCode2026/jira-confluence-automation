# Status Report App Implementation Tasks

Task IDs run from `T-001` through `T-028`. The implementation uses React 18,
Vite, Node.js, Express, Docker, and Jira Cloud.

## Task Conventions

- Tasks are ordered by dependency.
- Each task has one primary owner area and a verifiable acceptance criterion.
- Tests MUST use mocked Jira data and MUST NOT require live credentials.
- Tasks marked **Deferred** are intentionally excluded from v1.

## Phase 0: Baseline and Scaffolding

### T-001: Pin client dependencies

**Dependencies:** None

Update `client/package.json` with the specified React, Vite, plugin, Node.js,
and npm versions. Generate and commit the client lockfile.

**Acceptance criteria:**

- React and React DOM are `18.3.1`.
- Vite is `7.1.7`.
- `@vitejs/plugin-react` is `5.0.4`.
- Node.js and npm engine requirements are declared.
- `npm install` completes successfully in `client/`.

### T-002: Pin server dependencies

**Dependencies:** None

Update `server/package.json` with Express `5.1.0`, Node.js and npm engine
requirements, scripts, and a committed lockfile.

**Acceptance criteria:**

- Express is exactly `5.1.0`.
- `start`, `dev`, and test-related scripts are defined as applicable.
- `npm install` completes successfully in `server/`.

### T-003: Create client scaffold

**Dependencies:** T-001

Create the Vite configuration, React entry point, `App.jsx`, and the initial
client source directories.

**Acceptance criteria:**

- `npm run build` succeeds in `client/`.
- The client has a valid React entry point.
- Client modules follow the documented folder and naming conventions.

### T-004: Create Express scaffold

**Dependencies:** T-002

Create `server/src/app.js`, route registration, error middleware, and the
server source directories.

**Acceptance criteria:**

- `npm start` launches the Express process.
- The server does not contact Jira during startup.
- Unhandled errors use the safe API error shape.

### T-005: Add environment configuration

**Dependencies:** T-004

Implement `server/src/config/` and `server/.env.example` for Jira variables and
client API configuration.

**Acceptance criteria:**

- Required Jira variables are validated at startup or before generation.
- Missing configuration returns a safe error without secret values.
- `.env.example` contains placeholders only.
- Real `.env` files are ignored by Git.

### T-006: Add Docker local launch

**Dependencies:** T-003, T-004, T-005

Create Dockerfiles and local orchestration for the React client and Express API.

**Acceptance criteria:**

- Docker starts the client on `localhost:5173`.
- Docker starts the API on `localhost:3000`.
- `VITE_API_BASE_URL` points the client to the API.
- No database container is required.

## Phase 1: API Foundation

### T-007: Define report request validation

**Dependencies:** T-004, T-005

Implement validation for `projectKey` and `reportDate`, including the
`EPMCDMETST` fallback.

**Acceptance criteria:**

- An explicit Project Key overrides the default.
- An omitted Project Key uses `EPMCDMETST`.
- Invalid project keys are rejected before Jira calls.
- Report dates are valid UTC calendar inputs and cannot be future dates unless
  explicitly configured.

### T-008: Configure local API delivery

**Dependencies:** T-004, T-006

Implement JSON handling and local CORS for the documented client origin.

**Acceptance criteria:**

- `POST /api/reports` accepts JSON.
- Responses use `application/json`.
- Requests from `http://localhost:5173` are allowed.
- Production CORS and deployment behavior are not introduced.

### T-009: Implement safe API errors

**Dependencies:** T-004, T-005, T-007

Implement safe error responses for invalid input, missing configuration, Jira
authentication errors, Jira upstream errors, and unexpected failures.

**Acceptance criteria:**

- Every handled error has a user-safe message.
- Tokens, authorization headers, and raw Jira payloads are absent.
- No partial report is offered after failure.
- No detailed HTTP status taxonomy is required for v1.

### T-010: Define report response contract

**Dependencies:** T-007, T-008

Define the successful response containing Project Key, UTC reporting window,
sections, Markdown, and generated report file link.

**Acceptance criteria:**

- The response does not include `health` or `metrics` objects.
- The project object contains the Project Key only.
- The response includes `createdItems`, `completed`, and `blockers` sections.
- The response includes Markdown and the timestamped report file link.

## Phase 2: Jira Integration

### T-011: Implement UTC reporting window

**Dependencies:** T-007

Create the rolling seven-day UTC window ending on the supplied Report Date.

**Acceptance criteria:**

- Window calculations use UTC.
- Start and end values are returned consistently.
- Jira queries and displayed dates use the same window.

### T-012: Implement Jira API client

**Dependencies:** T-005, T-011

Create a server-side Jira REST client using `JIRA_SITE_URL`, `JIRA_EMAIL`, and
`JIRA_API_TOKEN`.

**Acceptance criteria:**

- Jira credentials never reach client code.
- Jira requests use server-side authentication.
- Non-2xx responses become safe application errors.
- Tests use mocked HTTP responses.

### T-013: Query canonical report issues

**Dependencies:** T-011, T-012

Retrieve Story and Bug issues for the selected Project Key whose Jira Created
field falls within the UTC seven-day window.

**Acceptance criteria:**

- Project filtering uses the supplied Project Key.
- Created filtering uses the calculated window.
- Required Jira fields are requested: project, key, issuetype, summary, status,
  assignee, created, reporter, StoryPoints when available, and blocker fields.
- Results are scoped to the canonical report universe.

### T-014: Normalize Jira issues

**Dependencies:** T-013

Map Jira responses to the normalized issue model and deduplicate by issue key.

**Acceptance criteria:**

- Required normalized fields are present.
- Jira `StoryPoints` maps to internal `storyPoints`.
- Missing StoryPoints becomes `null` and does not remove the issue from listings.
- Duplicate issue keys are retained once.
- Jira field names remain inside the adapter layer.

### T-015: Classify completed and blockers

**Dependencies:** T-014

Classify Done issues and current blockers within the canonical report universe.

**Acceptance criteria:**

- Completed items use Jira status `Done`.
- Blockers use Flagged `Impediment` or the `blocked` label.
- Blocker duration and changelog analysis are not implemented.
- Risk and at-risk classification are not implemented.

## Phase 3: Report Domain

### T-016: Calculate point metrics

**Dependencies:** T-014, T-015

Implement the v1 point formulas.

**Acceptance criteria:**

- `completedPoints` equals the sum of StoryPoints for Done items.
- `committedPoints` equals the sum of StoryPoints for all report items.
- Missing StoryPoints are excluded from both sums.
- Zero denominators produce finite values and no `NaN` or Infinity.
- Status-count metrics are not calculated or exposed.

### T-017: Calculate RAG status

**Dependencies:** T-015, T-016

Implement blocker precedence, 70% pace threshold, and unavailable pace behavior.

**Acceptance criteria:**

- Any blocker produces Red.
- No blockers and pace below 70% produces Amber.
- No blockers and pace at or above 70% produces Green.
- Missing or zero committed points produces Unavailable pace.
- No manual RAG override exists.

### T-018: Render canonical Markdown

**Dependencies:** T-014, T-015, T-016, T-017

Render the four-section Markdown report in exact order.

**Acceptance criteria:**

- Sections are Header, Created User Stories and Bugs, Completed This Week, and
  conditional Blockers / Impediments.
- Created and completed empty sections show `None`.
- Blockers section is omitted when no blockers exist.
- Dynamic Jira values are escaped safely for Markdown.
- No HTML, PDF, status counts, blocker duration, or risk output is rendered.

### T-019: Generate report filenames

**Dependencies:** T-018

Generate UTC timestamp-suffixed filenames.

**Acceptance criteria:**

- Names match `status_report_<YYYY-MM-DD>_<HH-mm-ss>Z.md`.
- Two reports generated on the same day do not intentionally share a filename.
- The filename date and timestamp use UTC.

## Phase 4: Filesystem and Frontend

### T-020: Write report artifacts

**Dependencies:** T-018, T-019

Write successful Markdown reports to `server/reports/` and return the file link.

**Acceptance criteria:**

- Successful generation creates exactly one Markdown artifact.
- Failed generation creates no partial artifact.
- The API response links to the generated file.
- No persistence or database service is required.

### T-021: Build report generation form

**Dependencies:** T-007, T-010

Create the React form for Project Key and Report Date.

**Acceptance criteria:**

- Project Key is prefilled with `EPMCDMETST` when needed.
- Report Date is submitted with the request.
- Client validation runs before the API request.
- The API client uses `VITE_API_BASE_URL`.

### T-022: Build report preview and download

**Dependencies:** T-010, T-020, T-021

Display the returned Markdown and generated artifact link.

**Acceptance criteria:**

- The UI displays the four report sections in the defined order.
- Markdown preview is available after success.
- Download uses the timestamped filename.
- No Jira credential appears in browser state or assets.

### T-023: Implement user-visible states

**Dependencies:** T-021, T-022

Implement loading, success, empty, validation-error, configuration-error, Jira
failure, and server-error states.

**Acceptance criteria:**

- Duplicate submissions are prevented while generation is active.
- Errors identify the affected operation without exposing secrets.
- Empty sections use the defined placeholder behavior.
- A failed request does not leave stale successful output presented as current.

## Phase 5: Verification and Documentation

### T-024: Add domain and adapter tests

**Dependencies:** T-014, T-016, T-017, T-018

Test normalization, filtering, point formulas, RAG logic, Markdown rendering,
and filename generation.

**Acceptance criteria:**

- Tests cover Done-only completed sums.
- Tests cover all-item committed sums.
- Tests cover missing StoryPoints and zero denominators.
- Tests cover blocker, Amber, Green, and Unavailable outcomes.
- Tests verify four-section Markdown order and escaping.

### T-025: Add API and frontend tests

**Dependencies:** T-009, T-010, T-021, T-023

Test API validation/error behavior and key frontend workflows.

**Acceptance criteria:**

- API tests cover valid requests, invalid inputs, configuration errors, and Jira
  failures.
- Frontend tests cover form submission, loading, success, empty, error, and
  download states.
- Tests do not use live Jira credentials.

### T-026: Add Docker smoke verification

**Dependencies:** T-006, T-020, T-023, T-024, T-025

Run the complete local application through Docker.

**Acceptance criteria:**

- Client and server start on the documented localhost ports.
- A configured or mocked report flow completes successfully.
- The generated Markdown file is present under `server/reports/`.
- No database container is started or required.
- No secrets appear in logs or client output.

### T-027: Document local setup

**Dependencies:** T-026

Update README and operational documentation with Docker, `.env`, test, and
report-download instructions.

**Acceptance criteria:**

- A new contributor can identify prerequisites and startup commands.
- `.env.example` usage is documented.
- Docker ports and API base URL are documented.
- Scope exclusions are documented clearly.

### T-028: Final v1 scope review

**Dependencies:** T-024, T-025, T-026, T-027

Perform a final review against the specification, constitution, and deferred work
list.

**Acceptance criteria:**

- No database, authentication, pagination, rate-limit, status-count, risk, or
  alternate-format implementation has been introduced.
- The four-section report contract is consistent across API, UI, renderer, and
  tests.
- All required acceptance criteria have corresponding tests.
- Formatting, linting, build, and test gates pass.

## Dependency Summary

- T-001 to T-006 establish the runnable baseline.
- T-007 to T-010 establish the API boundary.
- T-011 to T-015 establish normalized Jira data.
- T-016 to T-019 establish report calculations and Markdown.
- T-020 to T-023 establish filesystem and frontend behavior.
- T-024 to T-028 verify, document, and release the implementation.
