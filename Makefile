.PHONY: up down api jobs ui test test-api test-ui migrate rollback seed lint fmt

# ── Local Development ──────────────────────────────────────────────

up:
	docker compose up --build

down:
	docker compose down

api:
	cd api && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

jobs:
	cd jobs && python -m src.main

ui:
	cd ui && npm run dev

# ── Database ───────────────────────────────────────────────────────

migrate:
	cd api && alembic upgrade head

rollback:
	cd api && alembic downgrade -1

migration:
	cd api && alembic revision --autogenerate -m "$(name)"

seed:
	cd api && python -m src.seed

# ── Testing ────────────────────────────────────────────────────────

test: test-api test-ui

test-api:
	cd api && pytest

test-ui:
	cd ui && npm test

# ── Code Quality ───────────────────────────────────────────────────

lint:
	cd api && ruff check .
	cd jobs && ruff check .
	cd ui && npm run lint

fmt:
	cd api && ruff format .
	cd jobs && ruff format .
	cd ui && npm run format
