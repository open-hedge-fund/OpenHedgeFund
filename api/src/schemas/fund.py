import uuid
from datetime import datetime

from pydantic import BaseModel


class FundBase(BaseModel):
    fund_code: str
    fund_description: str
    is_active: bool = True
    is_offshore: bool = False
    is_master: bool = False


class FundCreate(FundBase):
    pass


class FundUpdate(BaseModel):
    fund_code: str | None = None
    fund_description: str | None = None
    is_active: bool | None = None
    is_offshore: bool | None = None
    is_master: bool | None = None


class FundSchema(FundBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
