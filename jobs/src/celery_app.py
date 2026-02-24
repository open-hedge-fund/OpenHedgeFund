import logging
import os
from datetime import datetime, timedelta, timezone

from celery import Celery
from celery.schedules import crontab
from sqlalchemy import text

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

app = Celery("openhedgefund", broker=REDIS_URL, backend=REDIS_URL)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # This is a temporary cron job to make sure jobs work with celery.
    # Also the job calls an open source api.
    # TODO: update this job to use a commercial pricing source.
    # I am not sure how reliable it is.
    beat_schedule={
        "fetch-fx-rates-daily": {
            "task": "src.tasks.fetch_fx_rates",
            "schedule": crontab(hour="*/4", minute=0),
        },
    },
)

app.autodiscover_tasks(["src"])

logger = logging.getLogger(__name__)

SKIP_WINDOW = timedelta(hours=4)


@app.on_after_finalize.connect
def run_missed_jobs(sender, **kwargs):
    """Trigger jobs that may have been missed while the worker was down.

    Checks last_run_at in the jobs table to avoid duplicate firing when
    multiple workers restart simultaneously.
    """
    from src.database import get_session

    task_name = "src.tasks.fetch_fx_rates"
    try:
        session = get_session()
        try:
            row = session.execute(
                text("""
                    SELECT MAX(last_run_at) AS last_run
                    FROM jobs
                    WHERE task_name = :task_name
                """),
                {"task_name": task_name},
            ).fetchone()

            if row and row.last_run:
                last_run = row.last_run
                if last_run.tzinfo is None:
                    last_run = last_run.replace(tzinfo=timezone.utc)
                cutoff = datetime.now(timezone.utc) - SKIP_WINDOW
                if last_run > cutoff:
                    logger.info(
                        "Skipping %s on startup — last ran at %s",
                        task_name,
                        last_run.isoformat(),
                    )
                    return
        finally:
            session.close()
    except Exception:
        logger.warning(
            "Could not check last_run_at for %s, firing anyway", task_name, exc_info=True
        )

    sender.send_task(task_name)
