import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import health, auth, api_keys, tickets, external, admin

logger = logging.getLogger("uvicorn.error")
settings = get_settings()

# Frontend dist/ path (populated by Docker multi-stage build)
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_type = (
        "PostgreSQL" if settings.DATABASE_URL.startswith("postgresql") else "SQLite"
    )
    logger.info(f"Database: {db_type}")
    if db_type == "SQLite":
        logger.warning(
            "SQLite is ephemeral in containers — use PostgreSQL for production!"
        )
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified (CREATE IF NOT EXISTS)")
        # Add columns that create_all won't add to existing tables
        if db_type == "PostgreSQL":
            migrations = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ",
                "ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS description VARCHAR(500)",
                "ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ",
            ]
            for sql in migrations:
                await conn.execute(text(sql))
            logger.info("Schema migrations applied")
    except Exception:
        # Multiple gunicorn workers race on create_all; losers hit
        # DuplicateTableError which is safe to ignore — tables exist.
        logger.info("Database tables already exist (concurrent worker)")
    yield


app = FastAPI(title="vibe-kanban", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5177"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.API_V1_PREFIX
app.include_router(health.router, prefix=prefix)
app.include_router(auth.router, prefix=prefix)
app.include_router(api_keys.router, prefix=prefix)
app.include_router(tickets.router, prefix=prefix)
app.include_router(external.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)

# Serve frontend static files in production (when dist/ exists)
if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve the React SPA for all non-API routes."""
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
