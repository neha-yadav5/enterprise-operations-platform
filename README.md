# NexusOne

Enterprise Operations Platform — people, projects, workflows, approvals,
documents, assets, reporting and administration in one application.

## Repository layout

```text
nexus-one/
├── frontend/     Angular 18 application (SSR + prerendering)
├── backend/      Spring Boot service — not started yet
└── docs/         Product, design and PRD documentation (git-ignored)
```

## Frontend

```bash
cd frontend
npm install
npm start            # dev server on http://localhost:4200
npm run build        # production build + prerender
```

Angular 18 with SSR, Tailwind and Angular Material. State currently lives in
in-memory fixture services under `frontend/src/app/core/`, so every screen is
fully interactive without a backend. Those services are the seam the real API
will replace — components read signals and never fetch directly.

See [`frontend/README.md`](frontend/README.md) for the Angular CLI reference.

### What is built

All nine sidebar modules (Employees, Departments, Projects, Requests,
Workflow, Assets, Documents, Reports, Analytics) with list, detail and
create/edit screens, plus Dashboard, Audit Logs, Notifications, My Profile,
Settings and a design-system page.

Also: five switchable themes, a mock RBAC layer with eight roles, and a
brand logo upload.

## Backend

Not started. See [`backend/README.md`](backend/README.md) for the intended
shape and what the frontend expects.

## Status

The frontend is UI-complete against the current PRDs and runs entirely on
fixtures. Nothing is persisted server-side and nothing is enforced — the
permission layer is a UI convenience, not a security boundary.
