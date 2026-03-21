import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from sqlalchemy import text

from app.core.database import engine, Base
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.api import health, auth, api_keys, tickets, external, admin

logger = logging.getLogger("uvicorn.error")
settings = get_settings()

# Frontend dist/ path (populated by Docker multi-stage build)
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


async def run_migrations(conn):
    """Run pending SQL migration files from migrations/ directory."""
    if not MIGRATIONS_DIR.is_dir():
        return
    # Create tracking table if it doesn't exist
    await conn.execute(
        text(
            "CREATE TABLE IF NOT EXISTS _migrations ("
            "  name VARCHAR(255) PRIMARY KEY,"
            "  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            ")"
        )
    )
    result = await conn.execute(text("SELECT name FROM _migrations"))
    applied = {row[0] for row in result.fetchall()}
    for sql_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
        if sql_file.name in applied:
            continue
        logger.info(f"Applying migration: {sql_file.name}")
        sql = sql_file.read_text()
        for statement in sql.split(";"):
            statement = statement.strip()
            if statement and not statement.startswith("--"):
                await conn.execute(text(statement))
        await conn.execute(
            text("INSERT INTO _migrations (name) VALUES (:name)"),
            {"name": sql_file.name},
        )
        logger.info(f"Migration applied: {sql_file.name}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_type = "PostgreSQL" if settings.DATABASE_URL.startswith("postgresql") else "SQLite"
    logger.info(f"Database: {db_type}")
    if db_type == "SQLite":
        logger.warning("SQLite is ephemeral in containers — use PostgreSQL for production!")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified (CREATE IF NOT EXISTS)")
        async with engine.begin() as conn:
            await run_migrations(conn)
        logger.info("Migrations checked")
    except Exception:
        # Multiple gunicorn workers race on create_all; losers hit
        # DuplicateTableError which is safe to ignore — tables exist.
        logger.info("Database tables already exist (concurrent worker)")
    yield


app = FastAPI(title="vibe-kanban", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

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
