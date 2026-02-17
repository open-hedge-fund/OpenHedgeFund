from src.celery_app import app
from src.file_processor import process_file_import


@app.task(name="src.tasks.process_file")
def process_file(file_import_id: str, file_content: str, file_type: str):
    """Process an uploaded file. Dispatched by the API after a file is uploaded."""
    return process_file_import(file_import_id, file_content, file_type)
