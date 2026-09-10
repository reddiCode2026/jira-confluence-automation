# Status Report App Constitution

## Purpose

This constitution defines the non-negotiable engineering principles for the
status-report-app project. It governs implementation, review, testing, and
future feature planning. The project produces a stakeholder-facing weekly
status report from Jira Cloud data through a React frontend and an Express
backend, with PostgreSQL 15 available through Docker when persistence is
required.

## Core Principles

### I. Specification and Stakeholder Value First

Every feature MUST trace to a documented user need, acceptance criterion, or
explicitly approved technical requirement. The primary outcome is a consistent,
professional report that helps a Project Manager communicate project health
quickly. Features outside the defined v1 scope MUST be identified as future
work rather than silently added to the product.

### II. Contract-Driven Full-Stack Boundaries

The React 18 frontend MUST communicate with the Node.js and Express backend
through explicit, documented HTTP contracts. Request and response shapes,
validation rules, error formats, and status codes MUST be stable and testable.
Business rules MUST live in backend services or domain modules, not be
reimplemented independently in React components.

### III. Deterministic and Auditable Reporting

Report results MUST be reproducible for the same source data, configuration,
and reporting window. Jira queries, rolling seven-day date boundaries, issue
classification, metric calculations, and RAG status decisions MUST be explicit
and covered by automated tests. A blocker MUST take precedence over pace when
calculating overall health, and the configured pace threshold MUST be visible
in code or configuration.

### IV. Secure Configuration and Data Handling

Credentials, API tokens, connection strings, and other secrets MUST be supplied
through environment variables or an approved secret store. Secrets MUST NOT be
committed, exposed in frontend bundles, logged, or returned in API errors. The
repository MUST provide safe placeholder configuration for onboarding. Jira
responses and generated reports MUST be treated as potentially sensitive
project data.

### V. Clear Separation of Concerns

The frontend MUST focus on presentation, user interaction, accessibility, and
request state. The backend MUST own Jira integration, normalization, validation,
report generation, persistence, and authorization boundaries. PostgreSQL 15
MUST be used only through a defined data-access layer when persistence is
needed. Docker configuration MUST be optional for features that do not require
a database and MUST provide a reproducible local PostgreSQL environment when
it is used.

### VI. Testable Quality and Failure Safety

Unit tests MUST cover domain calculations, Jira-data normalization, report
rendering, and error paths. API tests MUST cover validation, authentication
boundaries, success responses, and upstream failure handling. Frontend tests
MUST cover key user flows and visible error, loading, empty, and success states.
A failed Jira request, database operation, or validation step MUST produce a
clear error and MUST NOT create or expose a partial or misleading report.

### VII. Accessible and Usable Interface

The React application MUST support keyboard navigation, semantic HTML, useful
focus states, sufficient color contrast, and accessible names for controls.
Loading, empty, error, and success states MUST be understandable without
relying on color alone. The interface MUST present report sections, metrics,
blockers, and RAG status in an order that supports fast stakeholder scanning.

### VIII. Operational Simplicity and Observability

The application MUST have documented local setup and run commands for the
client, server, tests, and optional Docker/PostgreSQL services. Backend logs
MUST provide actionable context for failures without recording secrets or
unnecessary Jira payloads. Health checks and configuration validation SHOULD be
provided for services that run independently.

## Technical Constraints

- Frontend: React 18 with Vite.
- Backend: Node.js with Express.
- Database: PostgreSQL 15, provisioned through Docker when persistence is
  applicable.
- External source: Jira Cloud REST API using authenticated server-side calls.
- Initial reporting scope: one Jira project and a rolling seven-day window.
- Initial report format: Markdown, with explicit placeholders for empty
  sections.
- Initial health logic: blocked issues produce Red; otherwise the configured
  pace rule determines Amber or Green.
- Initial product scope excludes automated delivery, multi-project aggregation,
  per-assignee workload, burndown charts, and week-over-week trends unless the
  specification is deliberately revised.

## Development and Review Rules

1. A change MUST begin with an updated or confirmed specification when it
   changes user-visible behavior, API contracts, data models, or reporting
   rules.
2. Implementation plans MUST identify affected frontend, backend, database, and
   integration boundaries before coding begins.
3. New behavior MUST include focused automated tests at the layer that owns the
   behavior. Tests MUST be deterministic and MUST NOT require live Jira access
   or committed secrets.
4. Pull requests MUST describe the requirement addressed, validation performed,
   configuration changes, and any database migration or Docker impact.
5. Database schema changes MUST be delivered with a reversible or clearly
   documented migration strategy and MUST preserve existing report history
   unless data removal is explicitly required.
6. Dependencies MUST be justified by a concrete capability and kept compatible
   with the declared React, Node.js, Express, and PostgreSQL versions.

## Governance

This constitution is the governing engineering agreement for status-report-app.
If another document conflicts with it, the constitution takes precedence unless
an approved change explicitly revises this file.

Constitution changes MUST:

- state the motivation and affected principles;
- update the technical specification, API or database documentation, and tests
  when applicable;
- include a migration or compatibility note for existing behavior; and
- record the new version and approval date below.

The constitution MUST be reviewed whenever the product scope, data sensitivity,
external integrations, persistence model, or deployment model changes.

**Version**: 1.0.0  
**Ratified**: 2026-09-10  
**Last Amended**: 2026-09-10
