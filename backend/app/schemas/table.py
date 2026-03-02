from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any, Dict
from enum import Enum


class ColumnType(str, Enum):
    text = "text"
    integer = "integer"
    float_ = "float"
    boolean = "boolean"
    datetime_ = "datetime"
    json = "json"


class ColumnDefinition(BaseModel):
    name: str
    type: ColumnType
    nullable: bool = True
    default: Optional[str] = None


class TableCreate(BaseModel):
    name: str
    columns: List[ColumnDefinition]


class TableResponse(BaseModel):
    table_name: str
    columns: List[ColumnDefinition]
    row_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class TableListItem(BaseModel):
    table_name: str
    row_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class QueryParams(BaseModel):
    select: Optional[str] = "*"
    limit: int = 100
    offset: int = 0
    order_by: Optional[str] = None
    order_dir: Optional[str] = "asc"
