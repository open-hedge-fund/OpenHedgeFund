import uuid

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)

from src.config import settings
from src.database import get_user_db
from src.models.user import User


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.secret_key
    verification_token_secret = settings.secret_key

    async def on_after_register(self, user: User, request: Request | None = None):
        pass

    async def create(self, user_create, safe: bool = False, request: Request | None = None):
        from sqlalchemy import select

        from src.database import async_session_maker
        from src.models.tenant import Tenant

        org_name = getattr(user_create, "org_name", None) or (
            user_create.email.split("@")[0] + "'s Organization"
        )

        async with async_session_maker() as session:
            tenant = Tenant(name=org_name)
            session.add(tenant)
            await session.flush()
            tenant_id = tenant.id
            await session.commit()

        user_dict = {
            k: v
            for k, v in user_create.model_dump().items()
            if k not in ("password", "org_name")
        }
        user_dict["tenant_id"] = tenant_id
        user_dict["hashed_password"] = self.password_helper.hash(user_create.password)
        user_dict["id"] = uuid.uuid4()

        async with async_session_maker() as session:
            # Check if user already exists
            existing = await session.execute(
                select(User).where(User.email == user_create.email)
            )
            if existing.scalar_one_or_none():
                from fastapi_users.exceptions import UserAlreadyExists

                raise UserAlreadyExists()

            db_user = User(**user_dict)
            session.add(db_user)
            await session.commit()
            await session.refresh(db_user)

        return db_user


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.secret_key,
        lifetime_seconds=settings.access_token_lifetime_seconds,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
