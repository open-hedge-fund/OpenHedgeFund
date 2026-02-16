import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

FILE_NAMES = Literal["Pricing", "Holdings"]
FILE_TYPES = Literal["CSV", "PIPE"]


class FileBase(BaseModel):
    name: FILE_NAMES
    type: FILE_TYPES
    is_active: bool = True


class FileCreate(FileBase):
    pass


class FileUpdate(BaseModel):
    name: FILE_NAMES | None = None
    type: FILE_TYPES | None = None
    is_active: bool | None = None


class FileSchema(FileBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
