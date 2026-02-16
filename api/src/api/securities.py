from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.security import Security
from src.models.user import User
from src.schemas.security import SecurityCreate, SecuritySchema, SecurityUpdate

router = APIRouter(prefix="/securities", tags=["securities"])


@router.get("/", response_model=list[SecuritySchema])
async def list_securities(
    skip: int = 0,
    limit: int = 500,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Security)
    if not user.is_superuser:
        query = query.where(Security.tenant_id == user.tenant_id)
    query = query.order_by(Security.symbol).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/", response_model=SecuritySchema, status_code=201)
async def create_security(
    data_in: SecurityCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Security(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=SecuritySchema)
async def get_security(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Security).where(Security.id == item_id)
    if not user.is_superuser:
        query = query.where(Security.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security not found")
    return obj


@router.patch("/{item_id}", response_model=SecuritySchema)
async def update_security(
    item_id: int,
    data_in: SecurityUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Security).where(Security.id == item_id)
    if not user.is_superuser:
        query = query.where(Security.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_security(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Security).where(Security.id == item_id)
    if not user.is_superuser:
        query = query.where(Security.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security not found")
    await session.delete(obj)
    await session.commit()
