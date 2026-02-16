from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.file import File
from src.models.user import User
from src.schemas.file import FileCreate, FileSchema, FileUpdate

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/", response_model=list[FileSchema])
async def list_files(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(File)
        .where(File.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=FileSchema, status_code=201)
async def create_file(
    file_in: FileCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    file_data = file_in.model_dump()
    file_data["tenant_id"] = user.tenant_id
    file = File(**file_data)
    session.add(file)
    await session.commit()
    await session.refresh(file)
    return file


@router.get("/{file_id}", response_model=FileSchema)
async def get_file(
    file_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(File)
        .where(File.id == file_id)
        .where(File.tenant_id == user.tenant_id)
    )
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file


@router.patch("/{file_id}", response_model=FileSchema)
async def update_file(
    file_id: int,
    file_in: FileUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(File)
        .where(File.id == file_id)
        .where(File.tenant_id == user.tenant_id)
    )
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    update_data = file_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(file, key, value)
    await session.commit()
    await session.refresh(file)
    return file


@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(File)
        .where(File.id == file_id)
        .where(File.tenant_id == user.tenant_id)
    )
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    await session.delete(file)
    await session.commit()
