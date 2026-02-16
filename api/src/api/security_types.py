from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.security_type import SecurityType
from src.models.user import User
from src.schemas.security_type import SecurityTypeCreate, SecurityTypeSchema, SecurityTypeUpdate

router = APIRouter(prefix="/security-types", tags=["security-types"])


@router.get("/", response_model=list[SecurityTypeSchema])
async def list_security_types(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecurityType)
        .where(SecurityType.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=SecurityTypeSchema, status_code=201)
async def create_security_type(
    data_in: SecurityTypeCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = SecurityType(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=SecurityTypeSchema)
async def get_security_type(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecurityType)
        .where(SecurityType.id == item_id)
        .where(SecurityType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security type not found")
    return obj


@router.patch("/{item_id}", response_model=SecurityTypeSchema)
async def update_security_type(
    item_id: int,
    data_in: SecurityTypeUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecurityType)
        .where(SecurityType.id == item_id)
        .where(SecurityType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security type not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_security_type(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecurityType)
        .where(SecurityType.id == item_id)
        .where(SecurityType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security type not found")
    await session.delete(obj)
    await session.commit()
