from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.security_subtype import SecuritySubType
from src.models.user import User
from src.schemas.security_subtype import SecuritySubTypeCreate, SecuritySubTypeSchema, SecuritySubTypeUpdate

router = APIRouter(prefix="/security-subtypes", tags=["security-subtypes"])


@router.get("/", response_model=list[SecuritySubTypeSchema])
async def list_security_subtypes(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecuritySubType)
        .where(SecuritySubType.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=SecuritySubTypeSchema, status_code=201)
async def create_security_subtype(
    data_in: SecuritySubTypeCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = SecuritySubType(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=SecuritySubTypeSchema)
async def get_security_subtype(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecuritySubType)
        .where(SecuritySubType.id == item_id)
        .where(SecuritySubType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security subtype not found")
    return obj


@router.patch("/{item_id}", response_model=SecuritySubTypeSchema)
async def update_security_subtype(
    item_id: int,
    data_in: SecuritySubTypeUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecuritySubType)
        .where(SecuritySubType.id == item_id)
        .where(SecuritySubType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security subtype not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_security_subtype(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(SecuritySubType)
        .where(SecuritySubType.id == item_id)
        .where(SecuritySubType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Security subtype not found")
    await session.delete(obj)
    await session.commit()
