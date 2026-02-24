import uuid

from celery import Celery
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File as FastAPIFile
from sqlalchemy import desc, func, select
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
    latest_only: bool = Query(
        False, description="Return only the latest status row per file upload"
    ),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    if latest_only:
        # Subquery: for each source_import_id group, find the max created_at.
        # This gives us the latest audit-trail row per upload event.
        latest_sub = (
            select(func.max(FileImport.created_at).label("max_created"))
            .where(FileImport.tenant_id == user.tenant_id)
            .where(FileImport.source_import_id.is_not(None))
            .group_by(FileImport.source_import_id)
            .subquery()
        )

        query = (
            select(FileImport)
            .options(selectinload(FileImport.imported_by))
            .where(FileImport.created_at.in_(select(latest_sub.c.max_created)))
        )
        if not user.is_superuser:
            query = query.where(FileImport.tenant_id == user.tenant_id)
        if status:
            query = query.where(FileImport.status == status)
    else:
        query = select(FileImport).options(selectinload(FileImport.imported_by))
        if not user.is_superuser:
            query = query.where(FileImport.tenant_id == user.tenant_id)
        if status:
            query = query.where(FileImport.status == status)

    query = query.order_by(desc(FileImport.created_at)).offset(skip).limit(limit)
    result = await session.execute(query)
    imports = result.scalars().all()
    return [_with_name(fi) for fi in imports]


@router.get("/by-file/{file_id}/latest", response_model=FileImportSchema)
async def get_latest_file_import_by_file(
    file_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Get the latest import status row for a given file configuration."""
    query = (
        select(FileImport)
        .options(selectinload(FileImport.imported_by))
        .where(FileImport.file_id == file_id)
        .order_by(desc(FileImport.created_at))
        .limit(1)
    )
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    result = await session.execute(query)
    file_import = result.scalar_one_or_none()
    if not file_import:
        raise HTTPException(status_code=404, detail="No imports found for this file")
    return _with_name(file_import)


@router.get("/by-source/{source_import_id}/latest", response_model=FileImportSchema)
async def get_latest_by_source(
    source_import_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Get the latest status row for a specific upload event (tracked by source_import_id)."""
    query = (
        select(FileImport)
        .options(selectinload(FileImport.imported_by))
        .where(FileImport.source_import_id == source_import_id)
        .order_by(desc(FileImport.created_at))
        .limit(1)
    )
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    result = await session.execute(query)
    file_import = result.scalar_one_or_none()
    if not file_import:
        raise HTTPException(status_code=404, detail="File import not found")
    return _with_name(file_import)


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
        source_import_id=file_import_id,
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
