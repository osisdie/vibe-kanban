# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.4.0] - 2026-03-17

### Added
- **Forgot & Reset Password** — email-based password reset flow via SMTP
  - `POST /auth/forgot-password` sends reset email (anti-enumeration: always returns success)
  - `POST /auth/reset-password` validates JWT reset token (15-min expiry) and sets new password
  - Frontend: ForgotPasswordPage, ResetPasswordPage with full dark mode support
  - "Forgot password?" link on login page
- **Change Password** — self-service password change on profile page
  - `POST /auth/change-password` with current password verification
  - `password_changed_at` field on User model, displayed as "Last changed: X ago"
- **Admin Actions** — suspend/unsuspend users, revoke/regenerate API keys
  - `PATCH /admin/users/{id}/suspend` and `/unsuspend` (guard: cannot suspend self)
  - `PATCH /admin/api-keys/{id}/revoke` and `/regenerate`
  - Admin Users tab: active/suspended badge, Suspend/Unsuspend toggle per row
  - Admin Projects tab: Revoke/Regenerate buttons per row
- **User Self-Service API Key Actions** — revoke, regenerate, update on SettingsPage
  - `PATCH /api-keys/{id}/revoke`, `PATCH /api-keys/{id}/regenerate`
  - `PUT /api-keys/{id}` — update name and description
  - Revoked keys show "Revoked" badge with disabled board link
- **Project Description** — optional `description` field on ApiKey model and UI
- **API Key Timestamps** — `last_used_at` tracked on every API usage, displayed on project cards
- **User Profile Page** (`/profile`) — edit display name, view role/email/member-since
- **User Avatar** — circular avatar from Google OAuth photo or generated initial letter
- **Avatar Dropdown** — replaces old nav layout; includes Edit Profile, Admin Dashboard (super_admin), Dark Mode toggle, Logout
- **Dark Mode** — class-based toggle via ThemeContext, persisted to localStorage
  - Tailwind v4 `@custom-variant dark` configuration
  - Dark mode classes on all pages: Login, Register, ForgotPassword, ResetPassword, Settings, Profile, Admin
- **Footer** — "© 2026 vibe-kanban. Maintained by Kevin Wu" with GitHub link
- **SMTP Email Utility** — `backend/app/core/email.py` with async aiosmtplib
- **User `is_active` field** — enables account suspension; checked on every authenticated request (403 if suspended)

### Changed
- User model: added `is_active`, `password_changed_at` columns
- ApiKey model: added `description`, `last_used_at` columns
- `UserOut` schema: added `is_active`, `password_changed_at`, `created_at`
- `AdminUserOut` schema: added `is_active` field
- `AdminProjectOut` schema: added `description`, `last_used_at` fields
- `ApiKeyOut` / `ApiKeyCreate` schemas: added `description`, `last_used_at`
- `get_current_user()`: now checks `user.is_active`, raises 403 if suspended
- `increment_usage()`: now sets `api_key.last_used_at` on every API call
- Layout: removed "Admin" text link from left nav (moved into avatar dropdown)
- Login page: added dark mode classes
- Settings page: added SMTP config vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_APP_PASSWORD`)
- `requirements.txt`: added `aiosmtplib>=5.0.0`
- README: updated screenshots, features, data model, architecture diagram, env vars table

## [0.3.0] - 2026-03-17

### Added
- Super Admin role: first registered user becomes `super_admin`
- Admin dashboard (`/admin`) with stats cards (users, projects, tickets, API calls)
- Admin tables: Users, Projects, Tickets across all accounts
- Admin API endpoints: `GET /admin/stats`, `/admin/users`, `/admin/projects`, `/admin/tickets`
- `AdminRoute` guard component: redirects non-admin users to `/settings`
- PostgreSQL support via `asyncpg` driver
- `docker-compose.yml` now includes `postgres:16-alpine` service (port 5436:5432)
- Usage progress bar on SettingsPage project cards (color-coded: blue/yellow/red)
- `railway.toml` for Railway platform deployment
- Admin nav link in Layout (visible only to super_admin)

### Changed
- User model: added `role` field (`user` or `super_admin`)
- `UserOut` schema: now includes `role` field
- Auth registration: first user gets `super_admin` role (both email and Google OAuth)
- Frontend `User` type: added `role` field
- `.env.example`: added commented PostgreSQL DATABASE_URL example

## [0.2.0] - 2026-03-15

### Added
- Dockerfile with multi-stage build (Node frontend → Python backend in single container)
- docker-compose.yml for one-command local deployment
- .dockerignore to optimize Docker build context
- FastAPI serves frontend static files in production (SPA fallback routing)
- Makefile targets: `docker`, `docker-up`, `docker-down`
- README: Mermaid architecture diagram and ER data model diagram
- README: Docker deployment section with production checklist
- README: Cloud platform deployment comparison (Railway, Render, Fly.io, Coolify)
- README: Environment variables table with `Required` column

### Changed
- README restructured: added Architecture section with diagrams, split Quick Start into Docker vs Local options
- `backend/app/main.py`: conditionally mounts `frontend/dist/` and serves SPA routes when built frontend exists


## [0.1.0] - 2026-03-15

### Added
- 5-column Kanban board: TODO, Doing, Pending Confirming, Testing, Done
- Drag-and-drop ticket management with optimistic UI updates
- Dual authentication: email/password (JWT) + Google OAuth
- API Key management: up to 10 projects per account, 1000-action quota each
- External Agent API (`/api/v1/external/*`) with X-API-Key authentication
- Agent endpoints: create, list, get, update, move tickets; add comments; check usage
- Automatic audit trail: status changes generate timestamped comments
- Comment system for both humans and agents
- Priority levels (high, medium, low) with color-coded ticket cards
- Web UI: Login, Register, Settings (project management), Board pages
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy (async) + SQLite + Alembic migrations
- E2E tests: single task lifecycle + multi-task workflow
- CI: GitHub Actions (ruff lint + E2E + TS typecheck) + GitLab CI
- Pre-commit hooks: Ruff, TypeScript type-check, YAML/JSON validation
- Makefile with `install`, `setup`, `dev-backend`, `dev-frontend` targets
