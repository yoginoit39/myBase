from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    api_key: str
    created_at: datetime
    table_count: int = 0

    class Config:
        from_attributes = True


class ProjectListItem(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
    table_count: int = 0

    class Config:
        from_attributes = True
