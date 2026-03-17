from datetime import datetime
from pydantic import BaseModel


class ApiKeyCreate(BaseModel):
    name: str
    description: str | None = None


class ApiKeyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ApiKeyOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    key: str
    usage_count: int
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None = None

    model_config = {"from_attributes": True}
