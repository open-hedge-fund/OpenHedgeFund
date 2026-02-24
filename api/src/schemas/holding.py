import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class HoldingBase(BaseModel):
    holding_date: date
    security_id: int
    fund_id: int
    custodian_id: int
    broker_id: int | None = None
    strategy_id: int | None = None
    ccy_id: int | None = None
    side: str
    quantity_start: Decimal | None = None
    quantity_end: Decimal | None = None
    cost_local: Decimal | None = None
    cost_base: Decimal | None = None
    price_local: Decimal | None = None
    price_base: Decimal | None = None
    outstanding_shares: Decimal | None = None
    market_cap: Decimal | None = None


class HoldingCreate(HoldingBase):
    pass


class HoldingUpdate(BaseModel):
    holding_date: date | None = None
    security_id: int | None = None
    fund_id: int | None = None
    custodian_id: int | None = None
    broker_id: int | None = None
    strategy_id: int | None = None
    ccy_id: int | None = None
    side: str | None = None
    quantity_start: Decimal | None = None
    quantity_end: Decimal | None = None
    cost_local: Decimal | None = None
    cost_base: Decimal | None = None
    price_local: Decimal | None = None
    price_base: Decimal | None = None
    outstanding_shares: Decimal | None = None
    market_cap: Decimal | None = None


class HoldingSchema(HoldingBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
