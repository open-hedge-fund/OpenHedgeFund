import uuid
from typing import Literal

from fastapi_users import schemas
from pydantic import BaseModel


class UserRead(schemas.BaseUser[uuid.UUID]):
    tenant_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    role: str = "admin"


class UserCreate(schemas.BaseUserCreate):
    first_name: str | None = None
    last_name: str | None = None
    org_name: str | None = None


class UserUpdate(schemas.BaseUserUpdate):
    first_name: str | None = None
    last_name: str | None = None


class UserCreateInTenant(BaseModel):
    email: str
    password: str
    first_name: str | None = None
    last_name: str | None = None
    role: Literal["member", "admin"] = "member"


class UserRoleUpdate(BaseModel):
    role: Literal["member", "admin"]

    model_config = {"from_attributes": True}
