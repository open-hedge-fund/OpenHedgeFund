import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class PriceBase(BaseModel):
    price_date: date
    security_id: int
    currency_id: int
    last: Decimal
    next_day_open: Decimal | None = None
    last_modified_by: str | None = None
    last_modified_on: datetime | None = None


class PriceCreate(PriceBase):
    pass


class PriceUpdate(BaseModel):
    price_date: date | None = None
    security_id: int | None = None
    currency_id: int | None = None
    last: Decimal | None = None
    next_day_open: Decimal | None = None
    last_modified_by: str | None = None
    last_modified_on: datetime | None = None


class PriceSchema(PriceBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
