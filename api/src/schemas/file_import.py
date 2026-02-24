import uuid
from datetime import datetime

from pydantic import BaseModel


class FileImportBase(BaseModel):
    import_type: str
    status: str
    file_name: str | None = None
    file_size: int | None = None
    file_path: str | None = None


class FileImportCreate(FileImportBase):
    file_id: int | None = None


class FileImportUpdate(BaseModel):
    status: str | None = None
    rows_processed: int | None = None
    rows_failed: int | None = None
    completed_at: datetime | None = None
    duration_seconds: int | None = None
    error_message: str | None = None
    error_details: dict | None = None


class FileImportSchema(FileImportBase):
    id: uuid.UUID
    file_id: int | None = None
    source_import_id: uuid.UUID | None = None
    rows_processed: int | None = None
    rows_failed: int | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_seconds: int | None = None
    error_message: str | None = None
    error_details: dict | None = None
    imported_by_user_id: uuid.UUID | None = None
    imported_by_name: str | None = None
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
