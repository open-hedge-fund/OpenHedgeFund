import uuid
from datetime import datetime

from pydantic import BaseModel


class JobBase(BaseModel):
    name: str
    task_name: str
    cron_expression: str
    is_active: bool = True


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    name: str | None = None
    task_name: str | None = None
    cron_expression: str | None = None
    is_active: bool | None = None


class JobSchema(JobBase):
    id: int
    tenant_id: uuid.UUID
    last_run_at: datetime | None = None
    last_status: str | None = None
    last_error: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
