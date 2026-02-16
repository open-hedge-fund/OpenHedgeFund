from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.country import Country
from src.models.user import User
from src.schemas.country import CountryCreate, CountrySchema, CountryUpdate

router = APIRouter(prefix="/countries", tags=["countries"])


@router.get("/", response_model=list[CountrySchema])
async def list_countries(
    skip: int = 0,
    limit: int = 1000,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Country)
        .where(Country.tenant_id == user.tenant_id)
        .order_by(Country.country_code)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=CountrySchema, status_code=201)
async def create_country(
    data_in: CountryCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Country(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=CountrySchema)
async def get_country(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Country)
        .where(Country.id == item_id)
        .where(Country.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Country not found")
    return obj


@router.patch("/{item_id}", response_model=CountrySchema)
async def update_country(
    item_id: int,
    data_in: CountryUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Country)
        .where(Country.id == item_id)
        .where(Country.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Country not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_country(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Country)
        .where(Country.id == item_id)
        .where(Country.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Country not found")
    await session.delete(obj)
    await session.commit()
