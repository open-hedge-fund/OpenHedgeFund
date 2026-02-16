import uuid
from datetime import datetime

from pydantic import BaseModel


class ContinentBase(BaseModel):
    continent_code: str
    continent_desc: str | None = None
    is_active: bool = True


class ContinentCreate(ContinentBase):
    pass


class ContinentUpdate(BaseModel):
    continent_code: str | None = None
    continent_desc: str | None = None
    is_active: bool | None = None


class ContinentSchema(ContinentBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
