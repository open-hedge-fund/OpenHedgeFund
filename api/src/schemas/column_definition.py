import uuid
from datetime import datetime

from pydantic import BaseModel


class ColumnDefinitionBase(BaseModel):
    column_name: str
    mapping: str


class ColumnDefinitionCreate(ColumnDefinitionBase):
    file_id: int


class ColumnDefinitionUpdate(BaseModel):
    column_name: str | None = None
    mapping: str | None = None


class ColumnDefinitionSchema(ColumnDefinitionBase):
    id: int
    file_id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
