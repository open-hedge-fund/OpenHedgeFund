import os

from celery import Celery
from celery.schedules import crontab

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


@app.on_after_finalize.connect
def run_missed_jobs(sender, **kwargs):
    """Trigger jobs that may have been missed while the worker was down."""
    sender.send_task("src.tasks.fetch_fx_rates")
