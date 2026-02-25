import uuid
from datetime import datetime

from pydantic import BaseModel


class PortfolioBase(BaseModel):
    portfolio_code: str
    portfolio_desc: str
    is_active: bool = True


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    portfolio_code: str | None = None
    portfolio_desc: str | None = None
    is_active: bool | None = None


class PortfolioSchema(PortfolioBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
