import uuid
from datetime import datetime

from pydantic import BaseModel


class FileBase(BaseModel):
    name: str
    type: str
    is_active: bool = True


class FileCreate(FileBase):
    pass


class FileUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    is_active: bool | None = None


class FileSchema(FileBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
