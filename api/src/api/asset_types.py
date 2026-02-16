from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.asset_type import AssetType
from src.models.user import User
from src.schemas.asset_type import AssetTypeCreate, AssetTypeSchema, AssetTypeUpdate

router = APIRouter(prefix="/asset-types", tags=["asset-types"])


@router.get("/", response_model=list[AssetTypeSchema])
async def list_asset_types(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(AssetType)
        .where(AssetType.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=AssetTypeSchema, status_code=201)
async def create_asset_type(
    data_in: AssetTypeCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = AssetType(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=AssetTypeSchema)
async def get_asset_type(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(AssetType)
        .where(AssetType.id == item_id)
        .where(AssetType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Asset type not found")
    return obj


@router.patch("/{item_id}", response_model=AssetTypeSchema)
async def update_asset_type(
    item_id: int,
    data_in: AssetTypeUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(AssetType)
        .where(AssetType.id == item_id)
        .where(AssetType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Asset type not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_asset_type(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(AssetType)
        .where(AssetType.id == item_id)
        .where(AssetType.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Asset type not found")
    await session.delete(obj)
    await session.commit()
