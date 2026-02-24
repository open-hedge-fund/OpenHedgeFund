import logging
from datetime import datetime, timezone

from sqlalchemy import text

from src.celery_app import app
from src.database import get_session
from src.jobs.file_processor import process_file_import

logger = logging.getLogger(__name__)


@app.task(name="src.tasks.process_file")
def process_file(file_import_id: str, file_content: str, file_type: str):
    """Process an uploaded file. Dispatched by the API after a file is uploaded."""
    return process_file_import(file_import_id, file_content, file_type)


@app.task(name="src.tasks.fetch_fx_rates")
def fetch_fx_rates():
    """Fetch daily USD exchange rates and upsert into fx_rates."""
    from src.jobs.fx_rate_fetcher import fetch_and_upsert

    session = get_session()
    try:
        result = fetch_and_upsert()

        session.execute(
            text("""
                UPDATE jobs
                SET last_run_at = :now, last_status = 'SUCCESS', last_error = NULL
                WHERE task_name = 'src.tasks.fetch_fx_rates'
            """),
            {"now": datetime.now(timezone.utc)},
        )
        session.commit()

        return result

    except Exception as e:
        logger.exception("FX rate fetch failed")
        try:
            session.execute(
                text("""
                    UPDATE jobs
                    SET last_run_at = :now, last_status = 'FAILED', last_error = :error
                    WHERE task_name = 'src.tasks.fetch_fx_rates'
                """),
                {"now": datetime.now(timezone.utc), "error": str(e)},
            )
            session.commit()
        except Exception:
            session.rollback()
        raise
    finally:
        session.close()
