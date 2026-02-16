import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi_users.password import PasswordHelper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.permissions import require_tenant_admin
from src.database import get_async_session
from src.models.user import User
from src.schemas.user import UserCreateInTenant, UserRead, UserRoleUpdate

password_helper = PasswordHelper()

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserRead, status_code=201)
async def create_user_in_tenant(
    user_in: UserCreateInTenant,
    user: User = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_async_session),
):
    existing = await session.execute(select(User).where(User.email == user_in.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    new_user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        hashed_password=password_helper.hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=user_in.role,
        tenant_id=user.tenant_id,
        is_active=True,
        is_superuser=False,
        is_verified=False,
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user


@router.get("/", response_model=list[UserRead])
async def list_users(
    user: User = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_async_session),
):
    query = select(User)
    if not user.is_superuser:
        query = query.where(User.tenant_id == user.tenant_id)
    result = await session.execute(query)
    return result.scalars().all()


@router.patch("/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: uuid.UUID,
    role_in: UserRoleUpdate,
    user: User = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_async_session),
):
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    query = select(User).where(User.id == user_id)
    if not user.is_superuser:
        query = query.where(User.tenant_id == user.tenant_id)
    result = await session.execute(query)
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.role = role_in.role
    await session.commit()
    await session.refresh(target)
    return target
