import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class FxRateBase(BaseModel):
    rate_date: date
    ref_currency_id: int
    currency_id: int
    direct: Decimal
    indirect: Decimal
    last_modified_by: str | None = None
    last_modified_on: datetime | None = None


class FxRateCreate(FxRateBase):
    pass


class FxRateUpdate(BaseModel):
    rate_date: date | None = None
    ref_currency_id: int | None = None
    currency_id: int | None = None
    direct: Decimal | None = None
    indirect: Decimal | None = None
    last_modified_by: str | None = None
    last_modified_on: datetime | None = None


class FxRateSchema(FxRateBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
