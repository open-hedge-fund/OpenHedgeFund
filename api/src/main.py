from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.file_imports import router as file_imports_router
from src.api.files import router as files_router
from src.api.tenants import router as tenants_router
from src.api.users import router as users_router
from src.config import settings
from src.core.auth import auth_backend, fastapi_users
from src.schemas.user import UserCreate, UserRead, UserUpdate

app = FastAPI(
    title="OpenHedgeFund API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
app.include_router(tenants_router)
app.include_router(users_router)
app.include_router(files_router)
app.include_router(file_imports_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
