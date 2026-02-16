from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.market_category import MarketCategory
from src.models.user import User
from src.schemas.market_category import MarketCategoryCreate, MarketCategorySchema, MarketCategoryUpdate

router = APIRouter(prefix="/market-categories", tags=["market-categories"])


@router.get("/", response_model=list[MarketCategorySchema])
async def list_market_categories(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(MarketCategory)
    if not user.is_superuser:
        query = query.where(MarketCategory.tenant_id == user.tenant_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=MarketCategorySchema, status_code=201)
async def create_market_category(
    data_in: MarketCategoryCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = MarketCategory(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=MarketCategorySchema)
async def get_market_category(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(MarketCategory).where(MarketCategory.id == item_id)
    if not user.is_superuser:
        query = query.where(MarketCategory.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Market category not found")
    return obj


@router.patch("/{item_id}", response_model=MarketCategorySchema)
async def update_market_category(
    item_id: int,
    data_in: MarketCategoryUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(MarketCategory).where(MarketCategory.id == item_id)
    if not user.is_superuser:
        query = query.where(MarketCategory.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Market category not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_market_category(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(MarketCategory).where(MarketCategory.id == item_id)
    if not user.is_superuser:
        query = query.where(MarketCategory.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Market category not found")
    await session.delete(obj)
    await session.commit()
