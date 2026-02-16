from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.continent import Continent
from src.models.user import User
from src.schemas.continent import ContinentCreate, ContinentSchema, ContinentUpdate

router = APIRouter(prefix="/continents", tags=["continents"])


@router.get("/", response_model=list[ContinentSchema])
async def list_continents(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Continent)
    if not user.is_superuser:
        query = query.where(Continent.tenant_id == user.tenant_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=ContinentSchema, status_code=201)
async def create_continent(
    data_in: ContinentCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Continent(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=ContinentSchema)
async def get_continent(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Continent).where(Continent.id == item_id)
    if not user.is_superuser:
        query = query.where(Continent.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Continent not found")
    return obj


@router.patch("/{item_id}", response_model=ContinentSchema)
async def update_continent(
    item_id: int,
    data_in: ContinentUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Continent).where(Continent.id == item_id)
    if not user.is_superuser:
        query = query.where(Continent.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Continent not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_continent(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Continent).where(Continent.id == item_id)
    if not user.is_superuser:
        query = query.where(Continent.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Continent not found")
    await session.delete(obj)
    await session.commit()
