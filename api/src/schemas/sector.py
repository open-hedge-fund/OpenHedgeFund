import uuid
from datetime import datetime

from pydantic import BaseModel


class SectorBase(BaseModel):
    sector_code: str
    sector_desc: str
    is_active: bool = True


class SectorCreate(SectorBase):
    pass


class SectorUpdate(BaseModel):
    sector_code: str | None = None
    sector_desc: str | None = None
    is_active: bool | None = None


class SectorSchema(SectorBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
