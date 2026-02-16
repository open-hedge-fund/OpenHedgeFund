import uuid
from datetime import datetime

from pydantic import BaseModel


class CountryBase(BaseModel):
    country_code: str
    country_desc: str
    country_code_iso_alpha3: str | None = None
    geographic_region: str | None = None
    continent: str | None = None
    is_active: bool = True


class CountryCreate(CountryBase):
    pass


class CountryUpdate(BaseModel):
    country_code: str | None = None
    country_desc: str | None = None
    country_code_iso_alpha3: str | None = None
    geographic_region: str | None = None
    continent: str | None = None
    is_active: bool | None = None


class CountrySchema(CountryBase):
    id: int
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
