import uuid
from datetime import datetime

from pydantic import BaseModel


class SecuritySubTypeBase(BaseModel):
    security_subtype_code: str
    security_subtype_desc: str
    security_type_id: int
    geneva_record_type_id: int | None = None
    is_active: bool = True


class SecuritySubTypeCreate(SecuritySubTypeBase):
    pass


class SecuritySubTypeUpdate(BaseModel):
    security_subtype_code: str | None = None
    security_subtype_desc: str | None = None
    security_type_id: int | None = None
    geneva_record_type_id: int | None = None
    is_active: bool | None = None


class SecuritySubTypeSchema(SecuritySubTypeBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
