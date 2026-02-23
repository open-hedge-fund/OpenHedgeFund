"""Generic file loader — reads file content into a pandas DataFrame."""

import io

import pandas as pd


# Delimiter mapping by file type
DELIMITERS = {
    "CSV": ",",
    "PIPE": "|",
}


def load_to_dataframe(file_content: str, file_type: str) -> pd.DataFrame:
    """Parse file content into a pandas DataFrame.

    Args:
        file_content: Raw text content of the file.
        file_type: File type (CSV or PIPE) — determines the delimiter.

    Returns:
        A DataFrame with the parsed rows.

    Raises:
        ValueError: If file_type is not supported or content is empty/unparseable.
    """
    delimiter = DELIMITERS.get(file_type.upper())
    if delimiter is None:
        raise ValueError(f"Unsupported file type: {file_type}")

    if not file_content or not file_content.strip():
        raise ValueError("File content is empty")

    df = pd.read_csv(
        io.StringIO(file_content),
        delimiter=delimiter,
        dtype=str,
        keep_default_na=False,
    )

    if df.empty:
        raise ValueError("File contains no data rows")

    # Strip whitespace from headers
    df.columns = df.columns.str.strip()

    # Strip whitespace from all string values
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)

    # Replace empty strings with None
    df = df.replace("", None)

    return df
