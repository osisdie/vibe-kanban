from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["health"])
settings = get_settings()
STARTED_AT = datetime.now(timezone.utc)


@router.get("/health")
async def health():
    now = datetime.now(timezone.utc)
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "started_at": STARTED_AT.isoformat(),
        "uptime_seconds": int((now - STARTED_AT).total_seconds()),
    }
