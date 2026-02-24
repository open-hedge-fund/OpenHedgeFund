import uuid

from celery import Celery
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File as FastAPIFile
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config import settings
from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.file_import import FileImport
from src.models.user import User
from src.schemas.file_import import FileImportSchema

celery_app = Celery("openhedgefund", broker=settings.redis_url)

router = APIRouter(prefix="/file-imports", tags=["file-imports"])


def _with_name(fi: FileImport) -> FileImportSchema:
    """Convert a FileImport to schema, adding imported_by_name from the relationship."""
    data = FileImportSchema.model_validate(fi)
    if fi.imported_by:
        parts = [fi.imported_by.first_name, fi.imported_by.last_name]
        data.imported_by_name = " ".join(p for p in parts if p) or None
    return data


@router.get("/", response_model=list[FileImportSchema])
async def list_file_imports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: str | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """List file imports, showing only the latest status per file (DISTINCT ON file_id)."""
    query = (
        select(FileImport)
        .distinct(FileImport.file_id)
        .options(selectinload(FileImport.imported_by))
    )
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    if status:
        query = query.where(FileImport.status == status)
    # DISTINCT ON requires the first ORDER BY column to match the DISTINCT ON column
    query = (
        query.order_by(FileImport.file_id, desc(FileImport.created_at)).offset(skip).limit(limit)
    )
    result = await session.execute(query)
    imports = result.scalars().all()
    return [_with_name(fi) for fi in imports]


@router.get("/history/{file_id}", response_model=list[FileImportSchema])
async def get_file_import_history(
    file_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Return the full audit trail (all status rows) for a specific file."""
    query = (
        select(FileImport)
        .options(selectinload(FileImport.imported_by))
        .where(FileImport.file_id == file_id)
    )
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    query = query.order_by(desc(FileImport.created_at))
    result = await session.execute(query)
    imports = result.scalars().all()
    if not imports:
        raise HTTPException(status_code=404, detail="No imports found for this file")
    return [_with_name(fi) for fi in imports]


@router.get("/{import_id}", response_model=FileImportSchema)
async def get_file_import(
    import_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = (
        select(FileImport)
        .options(selectinload(FileImport.imported_by))
        .where(FileImport.id == import_id)
    )
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    result = await session.execute(query)
    file_import = result.scalar_one_or_none()
    if not file_import:
        raise HTTPException(status_code=404, detail="File import not found")
    return _with_name(file_import)


@router.post("/upload", response_model=FileImportSchema, status_code=201)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    file_id: int | None = Query(None),
    file_type: str = Query(...),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Upload a file, create an import record with status RECEIVED, and trigger processing."""
    # Validate file size
    contents = await file.read()
    file_size = len(contents)
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB.",
        )

    file_content = contents.decode("utf-8-sig")

    # Create FileImport record with status RECEIVED
    file_import_id = uuid.uuid4()
    file_import = FileImport(
        id=file_import_id,
        file_id=file_id,
        import_type="manual",
        status="RECEIVED",
        file_name=file.filename,
        file_size=file_size,
        imported_by_user_id=user.id,
        tenant_id=user.tenant_id,
    )
    session.add(file_import)
    await session.commit()
    await session.refresh(file_import)

    # TODO: In the future, upload file to S3 or object storage instead of sending content through Redis
    # Dispatch to Celery worker via Redis — file content travels with the task
    celery_app.send_task(
        "src.tasks.process_file",
        args=[str(file_import_id), file_content, file_type],
    )

    return file_import
