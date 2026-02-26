"""
Column mapping utilities for CSV/PIPE file uploads.

Provides mapping definitions and utilities to transform file columns
into the appropriate database fields during the ETL process.

Each mapping has a `role`:
  - "direct"   — value is stored straight into the holdings column
  - "resolver" — value is used to look up a foreign-key ID in a reference table
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class ColumnMapping:
    """Represents a mapping from a file column to a database field."""

    db_field: str
    description: str
    data_type: str
    role: str  # "direct" | "resolver"
    ref_table: str | None = None  # Reference table for resolver lookups
    resolves_to: str | None = None  # FK column name for resolvers (e.g. "security_id")
    nullable: bool = True


# ── Available mappings ───────────────────────────────────────────────────
# Simple flat keys — these are what the user picks from the dropdown.

COLUMN_MAPPINGS: dict[str, ColumnMapping] = {
    # ── Direct columns (stored straight to holdings) ─────────────────────
    "holding_date": ColumnMapping(
        db_field="holding_date",
        description="Holding Date",
        data_type="date",
        role="direct",
        nullable=False,
    ),
    "side": ColumnMapping(
        db_field="side",
        description="Long / Short",
        data_type="string",
        role="direct",
        nullable=False,
    ),
    "quantity_start": ColumnMapping(
        db_field="quantity_start",
        description="Quantity",
        data_type="decimal",
        role="direct",
    ),
    "quantity_end": ColumnMapping(
        db_field="quantity_end",
        description="Quantity (End)",
        data_type="decimal",
        role="direct",
    ),
    "cost_local": ColumnMapping(
        db_field="cost_local",
        description="Cost (Local)",
        data_type="decimal",
        role="direct",
    ),
    "cost_base": ColumnMapping(
        db_field="cost_base",
        description="Cost (Base)",
        data_type="decimal",
        role="direct",
    ),
    "price_local": ColumnMapping(
        db_field="price_local",
        description="Price (Local)",
        data_type="decimal",
        role="direct",
    ),
    "price_base": ColumnMapping(
        db_field="price_base",
        description="Price (Base)",
        data_type="decimal",
        role="direct",
    ),
    "outstanding_shares": ColumnMapping(
        db_field="outstanding_shares",
        description="Outstanding Shares",
        data_type="decimal",
        role="direct",
    ),
    "market_cap": ColumnMapping(
        db_field="market_cap",
        description="Market Cap",
        data_type="decimal",
        role="direct",
    ),
    # ── Resolvers (look up FK IDs) ───────────────────────────────────────
    "symbol": ColumnMapping(
        db_field="symbol",
        description="Ticker Symbol",
        data_type="string",
        role="resolver",
        ref_table="securities",
        resolves_to="security_id",
    ),
    "security_des": ColumnMapping(
        db_field="security_des",
        description="Security Name",
        data_type="string",
        role="resolver",
        ref_table="securities",
        resolves_to="security_id",
    ),
    "id_1": ColumnMapping(
        db_field="id_1",
        description="SEDOL",
        data_type="string",
        role="resolver",
        ref_table="securities",
        resolves_to="security_id",
    ),
    "id_2": ColumnMapping(
        db_field="id_2",
        description="ISIN",
        data_type="string",
        role="resolver",
        ref_table="securities",
        resolves_to="security_id",
    ),
    "id_3": ColumnMapping(
        db_field="id_3",
        description="CUSIP",
        data_type="string",
        role="resolver",
        ref_table="securities",
        resolves_to="security_id",
    ),
    "account_number": ColumnMapping(
        db_field="account_number",
        description="Custodian Account",
        data_type="string",
        role="resolver",
        ref_table="custodians",
        resolves_to="custodian_id",
    ),
    "fund_code": ColumnMapping(
        db_field="fund_code",
        description="Fund",
        data_type="string",
        role="resolver",
        ref_table="funds",
        resolves_to="fund_id",
    ),
    "broker_code": ColumnMapping(
        db_field="broker_code",
        description="Broker",
        data_type="string",
        role="resolver",
        ref_table="brokers",
        resolves_to="broker_id",
    ),
    "strategy_code": ColumnMapping(
        db_field="strategy_code",
        description="Strategy",
        data_type="string",
        role="resolver",
        ref_table="strategies",
        resolves_to="strategy_id",
    ),
    "ccy": ColumnMapping(
        db_field="ccy",
        description="Currency",
        data_type="string",
        role="resolver",
        ref_table="currencies",
        resolves_to="ccy_id",
    ),
    "country_code": ColumnMapping(
        db_field="country_code",
        description="Country",
        data_type="string",
        role="resolver",
        ref_table="countries",
        resolves_to="country_id",
    ),
    "asset_type_code": ColumnMapping(
        db_field="asset_type_code",
        description="Asset Class",
        data_type="string",
        role="resolver",
        ref_table="asset_types",
        resolves_to="asset_type_id",
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
            role = mapping.role
            if role not in summary:
                summary[role] = []
            summary[role].append(key)
        return summary
