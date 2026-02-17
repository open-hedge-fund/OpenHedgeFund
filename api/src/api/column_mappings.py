from typing import Any

from fastapi import APIRouter, Depends

from src.core.auth import current_active_user
from src.models.user import User
from src.utils.column_mapper import (
    ColumnMappingService,
    get_all_mappings,
    get_available_mapping_keys,
)

router = APIRouter(prefix="/column-mappings", tags=["column-mappings"])


@router.get("/available-mappings")
async def get_available_mappings(
    current_user: User = Depends(current_active_user),
) -> dict[str, Any]:
    """Return all available column mappings for the UI dropdown."""
    mapper_service = ColumnMappingService()
    all_mappings = get_all_mappings()

    formatted: list[dict[str, Any]] = []
    for key, mapping in all_mappings.items():
        formatted.append(
            {
                "key": key,
                "label": f"{mapping.description} ({mapping.db_field})",
                "table": mapping.table_name,
                "data_type": mapping.data_type,
                "description": mapping.description,
                "db_field": mapping.db_field,
                "csv_column": mapping.csv_column,
            }
        )

    grouped: dict[str, list[dict[str, Any]]] = {}
    for m in formatted:
        table = m["table"]
        if table not in grouped:
            grouped[table] = []
        grouped[table].append(m)

    return {
        "mappings": formatted,
        "grouped_mappings": grouped,
        "summary": mapper_service.get_mappings_summary(),
    }


@router.get("/mapping-keys")
async def get_mapping_keys_endpoint(
    current_user: User = Depends(current_active_user),
) -> list[str]:
    """Return a flat list of all available mapping keys."""
    return get_available_mapping_keys()


@router.get("/validate-mapping/{mapping_key:path}")
async def validate_mapping(
    mapping_key: str,
    current_user: User = Depends(current_active_user),
) -> dict[str, Any]:
    """Validate whether a mapping key exists and return its details."""
    mapper_service = ColumnMappingService()
    mapping = mapper_service.get_mapping(mapping_key)

    if mapping:
        return {
            "valid": True,
            "mapping": {
                "key": mapping_key,
                "db_field": mapping.db_field,
                "table_name": mapping.table_name,
                "data_type": mapping.data_type,
                "description": mapping.description,
                "csv_column": mapping.csv_column,
            },
        }
    return {
        "valid": False,
        "error": f"Mapping key '{mapping_key}' not found",
    }
