# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Docker (primary development method)
```bash
make up                    # docker compose up --build (all services)
make down                  # docker compose down
docker compose up --build db api ui   # start core services only
```

### API (local development, requires `docker compose up db`)
```bash
cd api && source .venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000   # or: make api
PYTHONPATH=. alembic upgrade head                            # or: make migrate
PYTHONPATH=. alembic revision --autogenerate -m "description"  # new migration
PYTHONPATH=. alembic downgrade -1                            # or: make rollback
pytest                                                       # or: make test-api
ruff check .                                                 # lint
ruff format .                                                # format
```

**Important:** Alembic commands from the `api/` directory require `PYTHONPATH=.` when running outside Docker. Inside Docker: `docker compose exec api alembic upgrade head`.

### UI (local development)
```bash
cd ui && npm install
npm run dev          # or: make ui (runs on port 3000, configured to 3010 locally)
npm run build        # production build
npm run lint         # eslint
npm test             # jest
```

### Jobs (local development, requires `docker compose up db redis`)
```bash
cd jobs && source .venv/bin/activate
pip install -e .                        # install dependencies (creates openhedgefund_jobs.egg-info/)
python debug_runner.py fx               # run FX rate fetcher locally
python debug_runner.py file <import_id> # run file processor locally
```

### Rebuilding after changes
Services run in Docker. After modifying Python files, rebuild:
```bash
docker compose up -d --build api                    # API changes
docker compose up -d --build jobs-worker jobs-beat   # Jobs changes
```

**Important:** Alembic inside Docker requires explicit PYTHONPATH:
```bash
docker compose exec -e PYTHONPATH=/app api alembic upgrade head
docker compose exec -e PYTHONPATH=/app api alembic downgrade -1
```

## Architecture

### Multi-tenant SaaS
Every resource is scoped to a **tenant**. On user registration, a Tenant is auto-created. All queries filter by `tenant_id` from the authenticated user. The `current_active_user` dependency (from fastapi-users) provides the user object with `tenant_id`.

### Backend Stack
- **FastAPI** with async routes, **SQLAlchemy 2.0+** with `Mapped`/`mapped_column` type annotations
- **fastapi-users** handles auth (JWT bearer tokens), registration, and user management
- **PostgreSQL** (async via asyncpg), **Alembic** for migrations
- **Pydantic v2** schemas with `model_config = {"from_attributes": True}`
- Use `model_dump()` (not `.dict()`), `model_dump(exclude_unset=True)` for partial updates

### Backend Patterns
- **Models:** `api/src/models/` — SQLAlchemy models inheriting from `src.database.Base`
- **Schemas:** `api/src/schemas/` — Pydantic schemas (Base, Create, Update, Schema per entity)
- **Routes:** `api/src/api/` — APIRouter per entity, registered in `src/main.py`
- **Auth:** `src.core.auth.current_active_user` dependency for all protected endpoints
- Routes use `session: AsyncSession = Depends(get_async_session)` and `user: User = Depends(current_active_user)`
- New models must be imported in `api/src/models/__init__.py` AND `api/migrations/env.py`

### Frontend Stack
- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **No Tailwind** — plain CSS with CSS custom properties in `ui/src/app/globals.css`
- **No component library** — vanilla HTML elements styled with CSS classes
- **Axios** for API calls with cookie-based JWT token (`js-cookie`)

### Frontend Patterns
- Pages use: `ProtectedRoute` > `DashboardLayout` > page content
- All pages are `"use client"` components
- API client in `ui/src/lib/api.ts` — add typed interfaces and API objects per entity
- Icons are inline SVGs in `ui/src/components/icons/SidebarIcons.tsx` (no icon libraries)
- Sidebar menu items configured as arrays in `ui/src/components/Sidebar.tsx`
- Constrained values (like file names/types) are defined as const arrays in the page component

### Jobs Service
- **Celery** workers (synchronous Python) — separate from FastAPI (async Python)
- **Sync SQLAlchemy** (`create_engine` + `sessionmaker`) in `jobs/src/database.py` — NOT async
- Jobs do NOT go through the API — they connect directly to the database
- `column_mapper.py` is duplicated between `api/` and `jobs/` (separate containers can't share imports)

### Jobs Service Structure
```
jobs/src/
├── celery_app.py          # Celery config + beat schedule
├── database.py            # Sync SQLAlchemy engine + get_session()
├── tasks.py               # Celery task registry (entry points)
├── column_mapper.py       # Column mapping config (duplicated from api/)
├── jobs/
│   ├── file_processor.py  # File import ETL orchestrator
│   ├── fx_rate_fetcher.py # FX rate fetcher (multi-tenant, free API)
│   ├── helpers/
│   │   ├── file_loader.py       # CSV/pipe-delimited parser → DataFrame
│   │   ├── status_writer.py     # Audit trail: insert_status() for file_imports
│   │   └── column_definitions.py # Fetch column_definitions from DB
│   ├── inserters/
│   │   └── holdings_inserter.py # Upserts holdings rows from DataFrame
│   ├── resolvers/
│   │   └── fk_resolver.py      # Resolves foreign keys (symbol/ISIN/SEDOL → security_id)
│   └── validators/
│       ├── base.py              # BaseValidator + ColumnDef/ValidationContext
│       ├── required_validator.py
│       ├── date_validator.py
│       ├── decimal_validator.py
│       ├── side_validator.py
│       └── reference_validator.py
```

### File Import ETL Pipeline
`file_processor.py` orchestrates: **Load → Validate → Resolve FKs → Insert → Report errors**
1. Fetches the RECEIVED file_import record and column_definitions
2. Loads raw file content into a pandas DataFrame (`file_loader.py`)
3. Runs validators (required, date, decimal, side, reference) — validators flag errors but don't modify data
4. Resolves foreign keys (FK resolver: first-win pattern when multiple identifiers map to same FK)
5. Inserts/upserts holdings via `holdings_inserter.py`
6. Reports errors back to file_imports as audit trail rows (RECEIVED → PROCESSING → PROCESSED/FAILED)

### FX Rate Fetcher
- Uses free exchangerate-api with frankfurter.dev as fallback
- Multi-tenant: loops through ALL tenants and upserts rates for each
- Returns `{"date": ..., "tenants": [per-tenant summaries]}`

### Enum Constraints
When adding restricted value fields, enforce at all three layers:
1. **Database:** Python `enum.Enum` + SQLAlchemy `Enum(MyEnum, native_enum=False, values_callable=lambda e: [x.value for x in e])` + CHECK constraint in migration
2. **API:** Pydantic `Literal["Value1", "Value2"]` type aliases
3. **UI:** Const arrays rendered as `<select>` dropdowns

### Key Config
- API default: `http://localhost:8000`, UI default: `http://localhost:3000`
- CORS origins configured in `api/src/config.py` via `CORS_ORIGINS` env var
- UI API base URL via `NEXT_PUBLIC_API_URL` env var
- DB connection: `DATABASE_URL` env var (default: `postgresql+asyncpg://openhedgefund:localdev@localhost:5432/openhedgefund`)

### Error Pages
- **404** — `ui/src/app/not-found.tsx` (auto-served by Next.js for unknown routes)
- **500** — `ui/src/app/500/page.tsx` (redirect here for server errors)
- **503** — `ui/src/app/503/page.tsx` (redirect here for maintenance)
- Shared component: `ui/src/components/ErrorPage.tsx`

### Debugging (VS Code)
- Launch configurations in `.vscode/launch.json` for FX Rate Fetcher and File Processor
- Uses `jobs/.venv/bin/python` with `cwd` set to `jobs/`
- Entry point: `jobs/debug_runner.py`

## Services (docker-compose)
| Service | Port | Description |
|---------|------|-------------|
| db | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 (for Celery) |
| api | 8000 | FastAPI |
| ui | 3000 | Next.js |
| jobs-worker | — | Celery worker |
| jobs-beat | — | Celery beat scheduler |
