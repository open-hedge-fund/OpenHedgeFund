from src.celery_app import app


@app.task
def hello():
    print("Hello")
