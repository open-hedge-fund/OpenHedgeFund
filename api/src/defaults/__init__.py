import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.defaults.asset_types import insert_default_asset_types_for_tenant
from src.defaults.continents import insert_default_continents_for_tenant
from src.defaults.files import insert_default_files_for_tenant
from src.defaults.countries import insert_default_countries_for_tenant
from src.defaults.currencies import insert_default_currencies_for_tenant
from src.defaults.market_categories import insert_default_market_categories_for_tenant
from src.defaults.security_subtypes import insert_default_security_subtypes_for_tenant
from src.defaults.column_definitions import insert_default_column_definitions_for_tenant
from src.defaults.security_types import insert_default_security_types_for_tenant


async def insert_defaults_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> None:
    """Insert all default reference data for a new tenant.

    Order matters: security_types must be inserted before security_subtypes
    since subtypes reference types via FK.
    """
    await insert_default_asset_types_for_tenant(session, tenant_id)
    await insert_default_continents_for_tenant(session, tenant_id)
    await insert_default_countries_for_tenant(session, tenant_id)
    await insert_default_currencies_for_tenant(session, tenant_id)
    await insert_default_market_categories_for_tenant(session, tenant_id)
    await insert_default_security_types_for_tenant(session, tenant_id)
    await insert_default_security_subtypes_for_tenant(session, tenant_id)
    await insert_default_files_for_tenant(session, tenant_id)
    await insert_default_column_definitions_for_tenant(session, tenant_id)
    await session.commit()
