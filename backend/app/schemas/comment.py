from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str
    author: str | None = None
