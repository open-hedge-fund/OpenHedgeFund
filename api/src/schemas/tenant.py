import uuid
from datetime import datetime

from pydantic import BaseModel


class TenantBase(BaseModel):
    name: str
    domain: str | None = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None


class TenantSchema(TenantBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
