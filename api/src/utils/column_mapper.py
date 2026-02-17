"""
Column mapping utilities for CSV/PIPE file uploads.

Provides mapping definitions and utilities to transform file columns
into the appropriate database fields during the ETL process.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any


class TableType(str, Enum):
    HOLDINGS = "holdings"
    POSITIONS = "positions"
    FX_RATES = "fx_rates"
    PRICES = "prices"


@dataclass
class ColumnMapping:
    """Represents a mapping from a file column to a database field."""

    csv_column: str
    db_field: str
    table_name: str
    data_type: str
    nullable: bool = True
    description: str = ""


# ── All available mappings keyed as "Table.field" ──────────────────────────

COLUMN_MAPPINGS: dict[str, ColumnMapping] = {
    # ── Holdings ──────────────────────────────────────────────────────────
    "Holding.holding_date": ColumnMapping(
        csv_column="Holding Date",
        db_field="holding_date",
        table_name="holdings",
        data_type="date",
        nullable=False,
        description="Date of the holding",
    ),
    "Holding.security_id": ColumnMapping(
        csv_column="Security ID",
        db_field="security_id",
        table_name="holdings",
        data_type="foreign_key",
        nullable=False,
        description="Security identifier",
    ),
    "Holding.fund_id": ColumnMapping(
        csv_column="Fund ID",
        db_field="fund_id",
        table_name="holdings",
        data_type="foreign_key",
        nullable=False,
        description="Fund identifier",
    ),
    "Holding.custodian_id": ColumnMapping(
        csv_column="Custodian ID",
        db_field="custodian_id",
        table_name="holdings",
        data_type="foreign_key",
        nullable=False,
        description="Custodian identifier",
    ),
    "Holding.side": ColumnMapping(
        csv_column="Side",
        db_field="side",
        table_name="holdings",
        data_type="string",
        nullable=False,
        description="Long or Short",
    ),
    "Holding.quantity": ColumnMapping(
        csv_column="Quantity",
        db_field="quantity",
        table_name="holdings",
        data_type="decimal",
        description="Number of units held",
    ),
    "Holding.cost": ColumnMapping(
        csv_column="Cost",
        db_field="cost",
        table_name="holdings",
        data_type="decimal",
        description="Total cost basis",
    ),
    "Holding.price_local": ColumnMapping(
        csv_column="Price Local",
        db_field="price_local",
        table_name="holdings",
        data_type="decimal",
        description="Price in local currency",
    ),
    "Holding.price_base": ColumnMapping(
        csv_column="Price Base",
        db_field="price_base",
        table_name="holdings",
        data_type="decimal",
        description="Price in base currency",
    ),
    "Holding.outstanding_shares": ColumnMapping(
        csv_column="Outstanding Shares",
        db_field="outstanding_shares",
        table_name="holdings",
        data_type="decimal",
        description="Total outstanding shares",
    ),
    "Holding.market_cap": ColumnMapping(
        csv_column="Market Cap",
        db_field="market_cap",
        table_name="holdings",
        data_type="decimal",
        description="Market capitalisation",
    ),
    # ── Positions ─────────────────────────────────────────────────────────
    "Position.position_date": ColumnMapping(
        csv_column="Position Date",
        db_field="position_date",
        table_name="positions",
        data_type="date",
        nullable=False,
        description="Date of the position",
    ),
    "Position.security_id": ColumnMapping(
        csv_column="Security ID",
        db_field="security_id",
        table_name="positions",
        data_type="foreign_key",
        nullable=False,
        description="Security identifier",
    ),
    "Position.fund_id": ColumnMapping(
        csv_column="Fund ID",
        db_field="fund_id",
        table_name="positions",
        data_type="foreign_key",
        nullable=False,
        description="Fund identifier",
    ),
    "Position.side": ColumnMapping(
        csv_column="Side",
        db_field="side",
        table_name="positions",
        data_type="string",
        nullable=False,
        description="Long or Short",
    ),
    "Position.quantity": ColumnMapping(
        csv_column="Quantity",
        db_field="quantity",
        table_name="positions",
        data_type="decimal",
        description="Number of units held",
    ),
    "Position.cost": ColumnMapping(
        csv_column="Cost",
        db_field="cost",
        table_name="positions",
        data_type="decimal",
        description="Total cost basis",
    ),
    "Position.price_local": ColumnMapping(
        csv_column="Price Local",
        db_field="price_local",
        table_name="positions",
        data_type="decimal",
        description="Price in local currency",
    ),
    "Position.price_base": ColumnMapping(
        csv_column="Price Base",
        db_field="price_base",
        table_name="positions",
        data_type="decimal",
        description="Price in base currency",
    ),
    "Position.outstanding_shares": ColumnMapping(
        csv_column="Outstanding Shares",
        db_field="outstanding_shares",
        table_name="positions",
        data_type="decimal",
        description="Total outstanding shares",
    ),
    "Position.market_cap": ColumnMapping(
        csv_column="Market Cap",
        db_field="market_cap",
        table_name="positions",
        data_type="decimal",
        description="Market capitalisation",
    ),
    # ── FX Rates ──────────────────────────────────────────────────────────
    "FxRate.rate_date": ColumnMapping(
        csv_column="Rate Date",
        db_field="rate_date",
        table_name="fx_rates",
        data_type="date",
        nullable=False,
        description="Date of the exchange rate",
    ),
    "FxRate.ref_currency_id": ColumnMapping(
        csv_column="Reference Currency ID",
        db_field="ref_currency_id",
        table_name="fx_rates",
        data_type="foreign_key",
        nullable=False,
        description="Reference currency identifier",
    ),
    "FxRate.currency_id": ColumnMapping(
        csv_column="Currency ID",
        db_field="currency_id",
        table_name="fx_rates",
        data_type="foreign_key",
        nullable=False,
        description="Target currency identifier",
    ),
    "FxRate.direct": ColumnMapping(
        csv_column="Direct Rate",
        db_field="direct",
        table_name="fx_rates",
        data_type="decimal",
        nullable=False,
        description="Direct exchange rate",
    ),
    "FxRate.indirect": ColumnMapping(
        csv_column="Indirect Rate",
        db_field="indirect",
        table_name="fx_rates",
        data_type="decimal",
        nullable=False,
        description="Indirect exchange rate",
    ),
    # ── Prices ────────────────────────────────────────────────────────────
    "Price.price_date": ColumnMapping(
        csv_column="Price Date",
        db_field="price_date",
        table_name="prices",
        data_type="date",
        nullable=False,
        description="Date of the price",
    ),
    "Price.security_id": ColumnMapping(
        csv_column="Security ID",
        db_field="security_id",
        table_name="prices",
        data_type="foreign_key",
        nullable=False,
        description="Security identifier",
    ),
    "Price.currency_id": ColumnMapping(
        csv_column="Currency ID",
        db_field="currency_id",
        table_name="prices",
        data_type="foreign_key",
        nullable=False,
        description="Currency identifier",
    ),
    "Price.last": ColumnMapping(
        csv_column="Last Price",
        db_field="last",
        table_name="prices",
        data_type="decimal",
        nullable=False,
        description="Last traded price",
    ),
    "Price.next_day_open": ColumnMapping(
        csv_column="Next Day Open",
        db_field="next_day_open",
        table_name="prices",
        data_type="decimal",
        description="Next day opening price",
    ),
}

# ── Table display names (mapping key prefix → human label) ────────────────
TABLE_DISPLAY_NAMES: dict[str, str] = {
    "holdings": "Holding",
    "positions": "Position",
    "fx_rates": "FxRate",
    "prices": "Price",
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

    def get_target_fields_for_file(
        self, column_definitions: list[dict[str, Any]]
    ) -> dict[str, dict[str, Any]]:
        field_mapping: dict[str, dict[str, Any]] = {}
        for col_def in column_definitions:
            csv_column = col_def["column_name"]
            mapping = self.get_mapping(col_def["mapping"])
            if mapping:
                field_mapping[csv_column] = {
                    "db_field": mapping.db_field,
                    "table_name": mapping.table_name,
                    "data_type": mapping.data_type,
                    "nullable": mapping.nullable,
                }
        return field_mapping

    def get_mappings_summary(self) -> dict[str, list[str]]:
        summary: dict[str, list[str]] = {}
        for key, mapping in COLUMN_MAPPINGS.items():
            table = mapping.table_name
            if table not in summary:
                summary[table] = []
            summary[table].append(key)
        return summary
