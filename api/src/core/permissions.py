from fastapi import Depends, HTTPException

from src.core.auth import current_active_user
from src.models.user import User


async def require_superuser(
    user: User = Depends(current_active_user),
) -> User:
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Superuser access required")
    return user


async def require_tenant_admin(
    user: User = Depends(current_active_user),
) -> User:
    if not user.is_superuser and user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
