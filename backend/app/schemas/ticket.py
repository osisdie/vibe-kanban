from datetime import datetime
from pydantic import BaseModel
from app.models.ticket import TicketStatus, TicketPriority


class TicketCreate(BaseModel):
    title: str
    description: str | None = None
    status: TicketStatus = TicketStatus.TODO
    priority: TicketPriority = TicketPriority.MEDIUM
    external_ref: str | None = None


class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: TicketPriority | None = None
    external_ref: str | None = None


class TicketMove(BaseModel):
    status: TicketStatus
    order: int | None = None


class CommentOut(BaseModel):
    id: int
    author: str
    content: str
    is_status_change: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketOut(BaseModel):
    id: int
    api_key_id: int
    title: str
    description: str | None = None
    status: str
    priority: str
    order: int
    external_ref: str | None = None
    created_at: datetime
    updated_at: datetime
    comments: list[CommentOut] = []

    model_config = {"from_attributes": True}


class TicketBrief(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    order: int
    external_ref: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
