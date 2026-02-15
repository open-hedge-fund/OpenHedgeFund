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
    beat_schedule={
        "hello-every-5-minutes": {
            "task": "src.tasks.hello",
            "schedule": crontab(minute="*/5"),
        },
    },
)

app.autodiscover_tasks(["src"])
