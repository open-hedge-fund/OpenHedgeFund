import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File as FastAPIFile
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.file_import import FileImport
from src.models.user import User
from src.schemas.file_import import FileImportCreate, FileImportSchema, FileImportUpdate

router = APIRouter(prefix="/file-imports", tags=["file-imports"])


@router.get("/", response_model=list[FileImportSchema])
async def list_file_imports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: str | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(FileImport)
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    if status:
        query = query.where(FileImport.status == status)
    query = query.order_by(desc(FileImport.created_at)).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{import_id}", response_model=FileImportSchema)
async def get_file_import(
    import_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(FileImport).where(FileImport.id == import_id)
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    result = await session.execute(query)
    file_import = result.scalar_one_or_none()
    if not file_import:
        raise HTTPException(status_code=404, detail="File import not found")
    return file_import


@router.post("/", response_model=FileImportSchema, status_code=201)
async def create_file_import(
    file_import_in: FileImportCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = file_import_in.model_dump()
    data["tenant_id"] = user.tenant_id
    data["imported_by_user_id"] = user.id
    file_import = FileImport(**data)
    session.add(file_import)
    await session.commit()
    await session.refresh(file_import)
    return file_import


@router.patch("/{import_id}", response_model=FileImportSchema)
async def update_file_import(
    import_id: uuid.UUID,
    file_import_in: FileImportUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(FileImport).where(FileImport.id == import_id)
    if not user.is_superuser:
        query = query.where(FileImport.tenant_id == user.tenant_id)
    result = await session.execute(query)
    file_import = result.scalar_one_or_none()
    if not file_import:
        raise HTTPException(status_code=404, detail="File import not found")
    update_data = file_import_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(file_import, key, value)
    await session.commit()
    await session.refresh(file_import)
    return file_import


@router.post("/upload", response_model=FileImportSchema, status_code=201)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    file_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Upload a file and create an import record. Actual processing is not yet implemented."""
    contents = await file.read()
    file_size = len(contents)

    file_import = FileImport(
        file_id=file_id,
        import_type="manual",
        status="pending",
        file_name=file.filename,
        file_size=file_size,
        imported_by_user_id=user.id,
        tenant_id=user.tenant_id,
    )
    session.add(file_import)
    await session.commit()
    await session.refresh(file_import)
    return file_import
