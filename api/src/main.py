from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.asset_types import router as asset_types_router
from src.api.brokers import router as brokers_router
from src.api.column_definitions import router as column_definitions_router
from src.api.column_mappings import router as column_mappings_router
from src.api.continents import router as continents_router
from src.api.countries import router as countries_router
from src.api.currencies import router as currencies_router
from src.api.custodians import router as custodians_router
from src.api.file_imports import router as file_imports_router
from src.api.files import router as files_router
from src.api.funds import router as funds_router
from src.api.holdings import router as holdings_router
from src.api.jobs import router as jobs_router
from src.api.fx_rates import router as fx_rates_router
from src.api.market_categories import router as market_categories_router
from src.api.positions import router as positions_router
from src.api.prices import router as prices_router
from src.api.securities import router as securities_router
from src.api.security_subtypes import router as security_subtypes_router
from src.api.strategies import router as strategies_router
from src.api.security_types import router as security_types_router
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
app.include_router(asset_types_router)
app.include_router(brokers_router)
app.include_router(column_definitions_router)
app.include_router(column_mappings_router)
app.include_router(continents_router)
app.include_router(countries_router)
app.include_router(currencies_router)
app.include_router(custodians_router)
app.include_router(funds_router)
app.include_router(holdings_router)
app.include_router(jobs_router)
app.include_router(fx_rates_router)
app.include_router(market_categories_router)
app.include_router(positions_router)
app.include_router(prices_router)
app.include_router(securities_router)
app.include_router(security_subtypes_router)
app.include_router(security_types_router)
app.include_router(strategies_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
