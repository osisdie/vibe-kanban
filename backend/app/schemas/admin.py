from datetime import datetime
from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_projects: int
    total_tickets: int
    total_api_calls: int


class AdminUserOut(BaseModel):
    id: int
    email: str
    display_name: str
    role: str
    created_at: datetime
    project_count: int
    ticket_count: int

    model_config = {"from_attributes": True}


class AdminProjectOut(BaseModel):
    id: int
    name: str
    owner_email: str
    owner_name: str
    usage_count: int
    ticket_count: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminTicketOut(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    project_name: str
    owner_email: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
