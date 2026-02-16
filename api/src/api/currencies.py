from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.currency import Currency
from src.models.user import User
from src.schemas.currency import CurrencyCreate, CurrencySchema, CurrencyUpdate

router = APIRouter(prefix="/currencies", tags=["currencies"])


@router.get("/", response_model=list[CurrencySchema])
async def list_currencies(
    skip: int = 0,
    limit: int = 500,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Currency)
        .where(Currency.tenant_id == user.tenant_id)
        .order_by(Currency.ccy)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=CurrencySchema, status_code=201)
async def create_currency(
    data_in: CurrencyCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Currency(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=CurrencySchema)
async def get_currency(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Currency)
        .where(Currency.id == item_id)
        .where(Currency.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Currency not found")
    return obj


@router.patch("/{item_id}", response_model=CurrencySchema)
async def update_currency(
    item_id: int,
    data_in: CurrencyUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Currency)
        .where(Currency.id == item_id)
        .where(Currency.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Currency not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_currency(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Currency)
        .where(Currency.id == item_id)
        .where(Currency.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Currency not found")
    await session.delete(obj)
    await session.commit()
