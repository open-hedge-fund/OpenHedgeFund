import uuid
from datetime import datetime

from pydantic import BaseModel


class CustodianBase(BaseModel):
    custodian_name: str
    custodian_code: str
    account_number: str
    email: str
    is_active: bool = True


class CustodianCreate(CustodianBase):
    pass


class CustodianUpdate(BaseModel):
    custodian_name: str | None = None
    custodian_code: str | None = None
    account_number: str | None = None
    email: str | None = None
    is_active: bool | None = None


class CustodianSchema(CustodianBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
