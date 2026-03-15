"""External Agent API — authenticated via X-API-Key header."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_api_key, increment_usage
from app.models.api_key import ApiKey
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketMove, TicketOut, TicketBrief
from app.schemas.comment import CommentCreate

router = APIRouter(prefix="/external", tags=["external"])


async def _get_ticket(ticket_id: int, api_key: ApiKey, db: AsyncSession) -> Ticket:
    result = await db.execute(
        select(Ticket)
        .where(Ticket.id == ticket_id, Ticket.api_key_id == api_key.id)
        .options(selectinload(Ticket.comments))
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/tickets", response_model=list[TicketBrief])
async def list_tickets(api_key: ApiKey = Depends(get_api_key), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Ticket).where(Ticket.api_key_id == api_key.id).order_by(Ticket.order)
    )
    return result.scalars().all()


@router.post("/tickets", response_model=TicketOut, status_code=201)
async def create_ticket(req: TicketCreate, api_key: ApiKey = Depends(get_api_key), db: AsyncSession = Depends(get_db)):
    await increment_usage(api_key, db)
    max_order = await db.execute(
        select(func.coalesce(func.max(Ticket.order), -1)).where(
            Ticket.api_key_id == api_key.id, Ticket.status == req.status
        )
    )
    ticket = Ticket(
        api_key_id=api_key.id,
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
async def get_ticket(ticket_id: int, api_key: ApiKey = Depends(get_api_key), db: AsyncSession = Depends(get_db)):
    return await _get_ticket(ticket_id, api_key, db)


@router.put("/tickets/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: int, req: TicketUpdate, api_key: ApiKey = Depends(get_api_key), db: AsyncSession = Depends(get_db)
):
    await increment_usage(api_key, db)
    ticket = await _get_ticket(ticket_id, api_key, db)
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)
    await db.flush()
    await db.refresh(ticket, attribute_names=["comments"])
    return ticket


@router.patch("/tickets/{ticket_id}/move", response_model=TicketOut)
async def move_ticket(
    ticket_id: int, req: TicketMove, api_key: ApiKey = Depends(get_api_key), db: AsyncSession = Depends(get_db)
):
    await increment_usage(api_key, db)
    ticket = await _get_ticket(ticket_id, api_key, db)
    old_status = ticket.status
    if old_status != req.status:
        ticket.status = req.status
        if req.order is not None:
            ticket.order = req.order
        else:
            max_order = await db.execute(
                select(func.coalesce(func.max(Ticket.order), -1)).where(
                    Ticket.api_key_id == api_key.id, Ticket.status == req.status
                )
            )
            ticket.order = max_order.scalar() + 1
        comment = Comment(
            ticket_id=ticket.id,
            author=f"agent:{api_key.name}",
            content=f"Status changed: {old_status} → {req.status.value}",
            is_status_change=True,
        )
        db.add(comment)
    elif req.order is not None:
        ticket.order = req.order
    await db.flush()
    await db.refresh(ticket, attribute_names=["comments"])
    return ticket


@router.post("/tickets/{ticket_id}/comments", response_model=TicketOut)
async def add_comment(
    ticket_id: int, req: CommentCreate, api_key: ApiKey = Depends(get_api_key), db: AsyncSession = Depends(get_db)
):
    await increment_usage(api_key, db)
    ticket = await _get_ticket(ticket_id, api_key, db)
    comment = Comment(
        ticket_id=ticket.id,
        author=req.author or f"agent:{api_key.name}",
        content=req.content,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(ticket, attribute_names=["comments"])
    return ticket


@router.get("/usage")
async def check_usage(api_key: ApiKey = Depends(get_api_key)):
    return {
        "name": api_key.name,
        "usage_count": api_key.usage_count,
        "remaining": 1000 - api_key.usage_count,
    }
