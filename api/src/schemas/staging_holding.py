import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class StagingHoldingBase(BaseModel):
    account: str | None = None
    account_name: str | None = None
    symbol: str | None = None
    security_description: str | None = None
    issuing_country: str | None = None
    local_currency: str | None = None
    asset_class: str | None = None
    side: str | None = None
    quantity: Decimal | None = None
    cost: Decimal | None = None
    price_local: Decimal | None = None
    price_base: Decimal | None = None
    outstanding_shares: Decimal | None = None
    market_cap: Decimal | None = None
    underlier: str | None = None
    sedol: str | None = None
    isin: str | None = None
    cusip: str | None = None
    file_id: int | None = None
    row_number: int | None = None
    runid: str | None = None


class StagingHoldingCreate(StagingHoldingBase):
    pass


class StagingHoldingUpdate(BaseModel):
    account: str | None = None
    account_name: str | None = None
    symbol: str | None = None
    security_description: str | None = None
    issuing_country: str | None = None
    local_currency: str | None = None
    asset_class: str | None = None
    side: str | None = None
    quantity: Decimal | None = None
    cost: Decimal | None = None
    price_local: Decimal | None = None
    price_base: Decimal | None = None
    outstanding_shares: Decimal | None = None
    market_cap: Decimal | None = None
    underlier: str | None = None
    sedol: str | None = None
    isin: str | None = None
    cusip: str | None = None
    file_id: int | None = None
    row_number: int | None = None
    runid: str | None = None


class StagingHoldingSchema(StagingHoldingBase):
    id: int
    tenant_id: uuid.UUID
    processed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
