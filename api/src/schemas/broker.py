import uuid
from datetime import datetime

from pydantic import BaseModel


class BrokerBase(BaseModel):
    broker_code: str
    broker_description: str


class BrokerCreate(BrokerBase):
    pass


class BrokerUpdate(BaseModel):
    broker_code: str | None = None
    broker_description: str | None = None


class BrokerSchema(BrokerBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
