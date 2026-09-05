# NexusOne — Backend

Not started. This folder is a placeholder so the repository shape is settled
before any code lands.

## Intended stack

Per the master specification (§18):

- Java + Spring Boot (Spring Security, Spring Data JPA)
- PostgreSQL
- Redis for caching
- RabbitMQ for the workflow/event layer
- MinIO (S3-compatible) for file storage
- Docker, GitHub Actions, Nginx

## What the frontend already assumes

The Angular app runs entirely on in-memory fixture services in
`frontend/src/app/core/`. Each one is a deliberate seam: components consume
signals and never fetch, so swapping a service's internals for HTTP calls
should not touch a single template.

| Fixture service | Replaces with |
|---|---|
| `employee.service.ts` | `/api/v1/employees` |
| `department.service.ts` | `/api/v1/departments` |
| `project.service.ts` | `/api/v1/projects` |
| `request.service.ts` | `/api/v1/requests` (+ approval transitions) |
| `workflow.service.ts` | `/api/v1/workflows` |
| `asset.service.ts` | `/api/v1/assets` |
| `document.service.ts` | `/api/v1/documents` (+ MinIO for the files) |
| `audit.service.ts` | `/api/v1/audit-events` — see the PRD for the query contract |
| `report.service.ts`, `analytics.service.ts` | server-side aggregation |
| `settings.service.ts` | `/api/v1/organisation`, `/api/v1/settings` |
| `profile.service.ts` | `/me`, `/me/preferences`, `/me/sessions` |

## Things the frontend fakes, and must stop faking

These are marked in the UI today, and each needs the backend before it is real:

- **Authentication.** `core/session.ts` hard-codes `CURRENT_USER_ID`. Sign out
  and MFA enrolment are disabled with that reason on them.
- **Authorisation.** `core/permissions/` is a UI convenience only. Every rule
  it expresses has to be enforced server-side; hidden buttons are not security.
- **File storage.** Document uploads create a record but no file. The brand
  logo is a data URL in `localStorage`.
- **Timestamps.** Services use a fixed date constant rather than `new Date()`,
  because the server prerenders and the browser hydrates, and two clock reads
  disagree. Replace with server-supplied timestamps.
- **Previous-period analytics.** Synthesised from multipliers — the fixtures
  hold no history.
- **Pagination and filtering.** Audit Logs pages in memory; the PRD requires
  this server-side.
