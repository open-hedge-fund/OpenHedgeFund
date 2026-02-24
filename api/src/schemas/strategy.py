import uuid
from datetime import datetime

from pydantic import BaseModel


class StrategyBase(BaseModel):
    strategy_code: str
    strategy_description: str
    is_active: bool = True


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    strategy_code: str | None = None
    strategy_description: str | None = None
    is_active: bool | None = None


class StrategySchema(StrategyBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
