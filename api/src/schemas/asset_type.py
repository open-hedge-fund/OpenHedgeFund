import uuid
from datetime import datetime

from pydantic import BaseModel


class AssetTypeBase(BaseModel):
    asset_type_code: str
    asset_type_desc: str | None = None
    is_active: bool = True


class AssetTypeCreate(AssetTypeBase):
    pass


class AssetTypeUpdate(BaseModel):
    asset_type_code: str | None = None
    asset_type_desc: str | None = None
    is_active: bool | None = None


class AssetTypeSchema(AssetTypeBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
