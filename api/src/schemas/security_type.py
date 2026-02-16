import uuid
from datetime import datetime

from pydantic import BaseModel


class SecurityTypeBase(BaseModel):
    security_type_code: str
    security_type_desc: str
    settlement_days: int | None = None
    is_active: bool = True


class SecurityTypeCreate(SecurityTypeBase):
    pass


class SecurityTypeUpdate(BaseModel):
    security_type_code: str | None = None
    security_type_desc: str | None = None
    settlement_days: int | None = None
    is_active: bool | None = None


class SecurityTypeSchema(SecurityTypeBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
