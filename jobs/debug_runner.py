"""Debug runner for job functions.

Usage:
    docker compose up -d db          # ensure database is running
    cd jobs
    python debug_runner.py fx        # run FX rate fetcher
    python debug_runner.py file <file_import_id> <file_content> <file_type>
"""

import sys

sys.path.insert(0, "src")


def run_fx():
    from src.database import get_session
    from src.jobs.fx_rate_fetcher import fetch_and_upsert

    session = get_session()
    try:
        result = fetch_and_upsert(session)
        session.commit()
        print("Result:", result)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def run_file(file_import_id: str, file_content: str, file_type: str):
    from src.jobs.file_processor import process_file_import

    result = process_file_import(file_import_id, file_content, file_type)
    print("Result:", result)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "fx":
        run_fx()
    elif command == "file":
        if len(sys.argv) < 5:
            print("Usage: python debug_runner.py file <file_import_id> <file_content> <file_type>")
            sys.exit(1)
        run_file(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)
