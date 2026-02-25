from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.sector import Sector
from src.models.user import User
from src.schemas.sector import SectorCreate, SectorSchema, SectorUpdate

router = APIRouter(prefix="/sectors", tags=["sectors"])


@router.get("/", response_model=list[SectorSchema])
async def list_sectors(
    skip: int = 0,
    limit: int = 1000,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Sector)
    if not user.is_superuser:
        query = query.where(Sector.tenant_id == user.tenant_id)
    result = await session.execute(
        query.order_by(Sector.sector_code).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=SectorSchema, status_code=201)
async def create_sector(
    data_in: SectorCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Sector(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=SectorSchema)
async def get_sector(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Sector).where(Sector.id == item_id)
    if not user.is_superuser:
        query = query.where(Sector.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Sector not found")
    return obj


@router.patch("/{item_id}", response_model=SectorSchema)
async def update_sector(
    item_id: int,
    data_in: SectorUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Sector).where(Sector.id == item_id)
    if not user.is_superuser:
        query = query.where(Sector.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Sector not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_sector(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Sector).where(Sector.id == item_id)
    if not user.is_superuser:
        query = query.where(Sector.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Sector not found")
    await session.delete(obj)
    await session.commit()
