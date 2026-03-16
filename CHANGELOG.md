# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
