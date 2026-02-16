import uuid
from datetime import datetime

from pydantic import BaseModel


class MarketCategoryBase(BaseModel):
    market_category_code: str
    market_category_desc: str | None = None
    is_active: bool = True


class MarketCategoryCreate(MarketCategoryBase):
    pass


class MarketCategoryUpdate(BaseModel):
    market_category_code: str | None = None
    market_category_desc: str | None = None
    is_active: bool | None = None


class MarketCategorySchema(MarketCategoryBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
