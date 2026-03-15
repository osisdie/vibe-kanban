from datetime import datetime
from pydantic import BaseModel


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyOut(BaseModel):
    id: int
    name: str
    key: str
    usage_count: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
