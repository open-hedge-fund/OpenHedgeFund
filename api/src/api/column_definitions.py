from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.column_definition import ColumnDefinition
from src.models.user import User
from src.schemas.column_definition import (
    ColumnDefinitionCreate,
    ColumnDefinitionSchema,
    ColumnDefinitionUpdate,
)

router = APIRouter(prefix="/column-definitions", tags=["column-definitions"])


@router.get("/", response_model=list[ColumnDefinitionSchema])
async def list_column_definitions(
    file_id: int | None = None,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(ColumnDefinition)
    if not user.is_superuser:
        query = query.where(ColumnDefinition.tenant_id == user.tenant_id)
    if file_id is not None:
        query = query.where(ColumnDefinition.file_id == file_id)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ColumnDefinitionSchema, status_code=201)
async def create_column_definition(
    data: ColumnDefinitionCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    col_def_data = data.model_dump()
    col_def_data["tenant_id"] = user.tenant_id
    col_def = ColumnDefinition(**col_def_data)
    session.add(col_def)
    await session.commit()
    await session.refresh(col_def)
    return col_def


@router.patch("/{col_def_id}", response_model=ColumnDefinitionSchema)
async def update_column_definition(
    col_def_id: int,
    data: ColumnDefinitionUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(ColumnDefinition).where(ColumnDefinition.id == col_def_id)
    if not user.is_superuser:
        query = query.where(ColumnDefinition.tenant_id == user.tenant_id)
    result = await session.execute(query)
    col_def = result.scalar_one_or_none()
    if not col_def:
        raise HTTPException(status_code=404, detail="Column definition not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(col_def, key, value)
    await session.commit()
    await session.refresh(col_def)
    return col_def


@router.delete("/{col_def_id}", status_code=204)
async def delete_column_definition(
    col_def_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(ColumnDefinition).where(ColumnDefinition.id == col_def_id)
    if not user.is_superuser:
        query = query.where(ColumnDefinition.tenant_id == user.tenant_id)
    result = await session.execute(query)
    col_def = result.scalar_one_or_none()
    if not col_def:
        raise HTTPException(status_code=404, detail="Column definition not found")
    await session.delete(col_def)
    await session.commit()
