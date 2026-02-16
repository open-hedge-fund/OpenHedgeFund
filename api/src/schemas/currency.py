import uuid
from datetime import datetime

from pydantic import BaseModel


class CurrencyBase(BaseModel):
    ccy: str
    ccy_des: str
    is_active: bool = True


class CurrencyCreate(CurrencyBase):
    pass


class CurrencyUpdate(BaseModel):
    ccy: str | None = None
    ccy_des: str | None = None
    is_active: bool | None = None


class CurrencySchema(CurrencyBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
