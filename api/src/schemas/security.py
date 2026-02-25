import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class SecurityBase(BaseModel):
    symbol: str | None = None
    security_des: str | None = None
    id_1: str | None = None
    id_2: str | None = None
    id_3: str | None = None
    cntry_of_risk_id: int | None = None
    cntry_of_domicile_id: int | None = None
    is_active: bool = True
    coupon: Decimal | None = None
    maturity_date: date | None = None
    issue_date: date | None = None
    first_coupon_date: date | None = None
    penultimate_coupon_date: date | None = None
    last_update_date: date | None = None
    ccy_id: int | None = None
    country_id: int | None = None
    security_subtype_id: int | None = None
    asset_type_id: int | None = None
    sector_id: int | None = None
    market_category_id: int | None = None


class SecurityCreate(SecurityBase):
    pass


class SecurityUpdate(BaseModel):
    symbol: str | None = None
    security_des: str | None = None
    id_1: str | None = None
    id_2: str | None = None
    id_3: str | None = None
    cntry_of_risk_id: int | None = None
    cntry_of_domicile_id: int | None = None
    is_active: bool | None = None
    coupon: Decimal | None = None
    maturity_date: date | None = None
    issue_date: date | None = None
    first_coupon_date: date | None = None
    penultimate_coupon_date: date | None = None
    last_update_date: date | None = None
    ccy_id: int | None = None
    country_id: int | None = None
    security_subtype_id: int | None = None
    asset_type_id: int | None = None
    sector_id: int | None = None
    market_category_id: int | None = None


class SecuritySchema(SecurityBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
