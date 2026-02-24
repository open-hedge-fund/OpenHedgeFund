FROM python:3.13-slim

WORKDIR /app

COPY shared/ /shared/
COPY jobs/pyproject.toml .
RUN pip install --no-cache-dir .

COPY jobs/ .
