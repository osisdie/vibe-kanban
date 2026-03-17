from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.api_key import ApiKey
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketMove,
    TicketOut,
    TicketBrief,
)
from app.schemas.comment import CommentCreate

router = APIRouter(tags=["tickets"])


async def _get_user_api_key(ak_id: int, user: User, db: AsyncSession) -> ApiKey:
    result = await db.execute(select(ApiKey).where(ApiKey.id == ak_id, ApiKey.user_id == user.id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    return api_key


async def _get_user_ticket(ticket_id: int, user: User, db: AsyncSession) -> Ticket:
    result = await db.execute(
        select(Ticket)
        .join(ApiKey)
        .where(Ticket.id == ticket_id, ApiKey.user_id == user.id)
        .options(selectinload(Ticket.comments))
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/api-keys/{ak_id}/tickets", response_model=list[TicketBrief])
async def list_tickets(
    ak_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_api_key(ak_id, user, db)
    result = await db.execute(select(Ticket).where(Ticket.api_key_id == ak_id).order_by(Ticket.order))
    return result.scalars().all()


@router.post("/api-keys/{ak_id}/tickets", response_model=TicketOut, status_code=201)
async def create_ticket(
    ak_id: int,
    req: TicketCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_api_key(ak_id, user, db)
    max_order = await db.execute(
        select(func.coalesce(func.max(Ticket.order), -1)).where(Ticket.api_key_id == ak_id, Ticket.status == req.status)
    )
    ticket = Ticket(
        api_key_id=ak_id,
        title=req.title,
        description=req.description,
        status=req.status,
        priority=req.priority,
        external_ref=req.external_ref,
        order=max_order.scalar() + 1,
    )
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket, attribute_names=["comments"])
    return ticket


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
async def get_ticket(
    ticket_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_user_ticket(ticket_id, user, db)


@router.put("/tickets/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: int,
    req: TicketUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await _get_user_ticket(ticket_id, user, db)
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)
    await db.flush()
    await db.refresh(ticket, attribute_names=["comments"])
    return ticket


@router.patch("/tickets/{ticket_id}/move", response_model=TicketOut)
async def move_ticket(
    ticket_id: int,
    req: TicketMove,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await _get_user_ticket(ticket_id, user, db)
    old_status = ticket.status
    if old_status != req.status:
        ticket.status = req.status
        if req.order is not None:
            ticket.order = req.order
        else:
            max_order = await db.execute(
                select(func.coalesce(func.max(Ticket.order), -1)).where(
                    Ticket.api_key_id == ticket.api_key_id, Ticket.status == req.status
                )
            )
            ticket.order = max_order.scalar() + 1
        comment = Comment(
            ticket_id=ticket.id,
            author="system",
            content=f"Status changed: {old_status} → {req.status.value}",
            is_status_change=True,
        )
        db.add(comment)
    elif req.order is not None:
        ticket.order = req.order
    await db.flush()
    await db.refresh(ticket, attribute_names=["comments"])
    return ticket


@router.delete("/tickets/{ticket_id}", status_code=204)
async def delete_ticket(
    ticket_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await _get_user_ticket(ticket_id, user, db)
    await db.delete(ticket)


@router.post("/tickets/{ticket_id}/comments", response_model=TicketOut)
async def add_comment(
    ticket_id: int,
    req: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await _get_user_ticket(ticket_id, user, db)
    comment = Comment(
        ticket_id=ticket.id,
        author=req.author or user.display_name,
        content=req.content,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(ticket, attribute_names=["comments"])
    return ticket
