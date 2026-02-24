"""
Column mapping utilities for CSV/PIPE file uploads.

Provides mapping definitions and utilities to transform file columns
into the appropriate database fields during the ETL process.
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class ColumnMapping:
    """Represents a mapping from a file column to a database field."""

    db_field: str
    table_name: str
    data_type: str
    nullable: bool = True
    description: str = ""


# ── Available mappings ───────────────────────────────────────────────────
# Simple flat keys — these are what the user picks from the dropdown.

COLUMN_MAPPINGS: dict[str, ColumnMapping] = {
    "symbol": ColumnMapping(
        db_field="symbol",
        table_name="securities",
        data_type="string",
        description="Ticker symbol",
    ),
    "id_1": ColumnMapping(
        db_field="id_1",
        table_name="securities",
        data_type="string",
        description="Security ID 1 (e.g. CUSIP)",
    ),
    "id_2": ColumnMapping(
        db_field="id_2",
        table_name="securities",
        data_type="string",
        description="Security ID 2 (e.g. ISIN)",
    ),
    "id_3": ColumnMapping(
        db_field="id_3",
        table_name="securities",
        data_type="string",
        description="Security ID 3 (e.g. SEDOL)",
    ),
    "asset_type_code": ColumnMapping(
        db_field="asset_type_code",
        table_name="asset_types",
        data_type="string",
        description="Asset type code",
    ),
    "continent_code": ColumnMapping(
        db_field="continent_code",
        table_name="continents",
        data_type="string",
        description="Continent code",
    ),
    "custodian_code": ColumnMapping(
        db_field="custodian_code",
        table_name="custodians",
        data_type="string",
        description="Custodian code",
    ),
    "country_code": ColumnMapping(
        db_field="country_code",
        table_name="countries",
        data_type="string",
        description="Country code",
    ),
    "ccy": ColumnMapping(
        db_field="ccy",
        table_name="currencies",
        data_type="string",
        description="Currency code",
    ),
    "holding_date": ColumnMapping(
        db_field="holding_date",
        table_name="holdings",
        data_type="date",
        nullable=False,
        description="Holding date",
    ),
    "fund_code": ColumnMapping(
        db_field="fund_code",
        table_name="funds",
        data_type="string",
        description="Fund code",
    ),
    "market_category_code": ColumnMapping(
        db_field="market_category_code",
        table_name="market_categories",
        data_type="string",
        description="Market category code",
    ),
    "security_subtype_code": ColumnMapping(
        db_field="security_subtype_code",
        table_name="security_subtypes",
        data_type="string",
        description="Security subtype code",
    ),
    "account_number": ColumnMapping(
        db_field="account_number",
        table_name="custodians",
        data_type="string",
        description="Custodian account number",
    ),
    "cost_local": ColumnMapping(
        db_field="cost_local",
        table_name="holdings",
        data_type="decimal",
        description="Cost in local currency",
    ),
    "cost_base": ColumnMapping(
        db_field="cost_base",
        table_name="holdings",
        data_type="decimal",
        description="Cost in base currency",
    ),
    "side": ColumnMapping(
        db_field="side",
        table_name="holdings",
        data_type="string",
        nullable=False,
        description="Long or Short",
    ),
    "quantity_start": ColumnMapping(
        db_field="quantity_start",
        table_name="holdings",
        data_type="decimal",
        description="Starting quantity",
    ),
    "quantity_end": ColumnMapping(
        db_field="quantity_end",
        table_name="holdings",
        data_type="decimal",
        description="Ending quantity",
    ),
    "price_local": ColumnMapping(
        db_field="price_local",
        table_name="holdings",
        data_type="decimal",
        description="Price in local currency",
    ),
    "price_base": ColumnMapping(
        db_field="price_base",
        table_name="holdings",
        data_type="decimal",
        description="Price in base currency",
    ),
    "outstanding_shares": ColumnMapping(
        db_field="outstanding_shares",
        table_name="holdings",
        data_type="decimal",
        description="Total outstanding shares",
    ),
    "market_cap": ColumnMapping(
        db_field="market_cap",
        table_name="holdings",
        data_type="decimal",
        description="Market capitalisation",
    ),
    "security_type_code": ColumnMapping(
        db_field="security_type_code",
        table_name="security_types",
        data_type="string",
        description="Security type code",
    ),
}


def get_all_mappings() -> dict[str, ColumnMapping]:
    return COLUMN_MAPPINGS.copy()


def get_mapping_by_key(key: str) -> ColumnMapping | None:
    return COLUMN_MAPPINGS.get(key)


def get_available_mapping_keys() -> list[str]:
    return list(COLUMN_MAPPINGS.keys())


def validate_mapping_key(key: str) -> bool:
    return key in COLUMN_MAPPINGS


class ColumnMappingService:
    """Service class for column mapping operations."""

    def get_mapping(self, key: str) -> ColumnMapping | None:
        return get_mapping_by_key(key)

    def validate_column_definitions(
        self, column_definitions: list[dict[str, Any]]
    ) -> list[str]:
        errors: list[str] = []
        for i, col_def in enumerate(column_definitions):
            mapping_key = col_def.get("mapping")
            if not mapping_key:
                errors.append(f"Column definition {i + 1}: Missing mapping key")
                continue
            if not validate_mapping_key(mapping_key):
                errors.append(
                    f"Column definition {i + 1}: Invalid mapping key '{mapping_key}'"
                )
        return errors

    def get_mappings_summary(self) -> dict[str, list[str]]:
        summary: dict[str, list[str]] = {}
        for key, mapping in COLUMN_MAPPINGS.items():
            table = mapping.table_name
            if table not in summary:
                summary[table] = []
            summary[table].append(key)
        return summary
