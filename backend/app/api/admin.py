"""Admin API — super_admin only endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.api_key import ApiKey
from app.models.ticket import Ticket
from app.schemas.admin import AdminStats, AdminUserOut, AdminProjectOut, AdminTicketOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
async def get_stats(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = await db.scalar(select(func.count()).select_from(User))
    total_projects = await db.scalar(select(func.count()).select_from(ApiKey))
    total_tickets = await db.scalar(select(func.count()).select_from(Ticket))
    total_api_calls = await db.scalar(
        select(func.coalesce(func.sum(ApiKey.usage_count), 0))
    )
    return AdminStats(
        total_users=total_users or 0,
        total_projects=total_projects or 0,
        total_tickets=total_tickets or 0,
        total_api_calls=total_api_calls or 0,
    )


@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()

    out = []
    for user in users:
        project_count = await db.scalar(
            select(func.count()).select_from(ApiKey).where(ApiKey.user_id == user.id)
        )
        ticket_count = await db.scalar(
            select(func.count())
            .select_from(Ticket)
            .join(ApiKey)
            .where(ApiKey.user_id == user.id)
        )
        out.append(
            AdminUserOut(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                role=user.role,
                created_at=user.created_at,
                project_count=project_count or 0,
                ticket_count=ticket_count or 0,
            )
        )
    return out


@router.get("/projects", response_model=list[AdminProjectOut])
async def list_projects(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey, User)
        .join(User, ApiKey.user_id == User.id)
        .order_by(ApiKey.created_at.desc())
    )
    rows = result.all()

    out = []
    for api_key, user in rows:
        ticket_count = await db.scalar(
            select(func.count())
            .select_from(Ticket)
            .where(Ticket.api_key_id == api_key.id)
        )
        out.append(
            AdminProjectOut(
                id=api_key.id,
                name=api_key.name,
                owner_email=user.email,
                owner_name=user.display_name,
                usage_count=api_key.usage_count,
                ticket_count=ticket_count or 0,
                is_active=api_key.is_active,
                created_at=api_key.created_at,
            )
        )
    return out


@router.get("/tickets", response_model=list[AdminTicketOut])
async def list_tickets(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ticket, ApiKey, User)
        .join(ApiKey, Ticket.api_key_id == ApiKey.id)
        .join(User, ApiKey.user_id == User.id)
        .order_by(Ticket.updated_at.desc())
        .limit(200)
    )
    rows = result.all()

    return [
        AdminTicketOut(
            id=ticket.id,
            title=ticket.title,
            status=ticket.status,
            priority=ticket.priority,
            project_name=api_key.name,
            owner_email=user.email,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        )
        for ticket, api_key, user in rows
    ]
