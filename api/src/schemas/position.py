import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class PositionBase(BaseModel):
    position_date: date
    security_id: int
    fund_id: int
    strategy_id: int | None = None
    ccy_id: int | None = None
    side: str
    quantity: Decimal | None = None
    cost: Decimal | None = None
    price_local: Decimal | None = None
    price_base: Decimal | None = None
    outstanding_shares: Decimal | None = None
    market_cap: Decimal | None = None


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    position_date: date | None = None
    security_id: int | None = None
    fund_id: int | None = None
    strategy_id: int | None = None
    ccy_id: int | None = None
    side: str | None = None
    quantity: Decimal | None = None
    cost: Decimal | None = None
    price_local: Decimal | None = None
    price_base: Decimal | None = None
    outstanding_shares: Decimal | None = None
    market_cap: Decimal | None = None


class PositionSchema(PositionBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
