# OpenHedgeFund

An open-source hedge fund infrastructure platform.

## Architecture

| Component | Stack | Description |
|-----------|-------|-------------|
| **API** | Python / FastAPI | REST API with database migrations |
| **Jobs** | Python | Background job processing |
| **UI** | Node.js / React | Web dashboard |
| **Infra** | Terraform | Infrastructure as code |

## Prerequisites

- Docker & Docker Compose
- Python 3.13+
- Node.js 22+
- Terraform 1.5+

## Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/open-hedge-fund/OpenHedgeFund.git
cd OpenHedgeFund

# Start core services (Postgres, API, UI)
docker compose up --build db api ui

# Run database migrations (in a second terminal)
docker compose exec api alembic revision --autogenerate -m "initial"
docker compose exec api alembic upgrade head
```

API at http://localhost:8000, UI at http://localhost:3000.

## Local Development (without Docker)

You still need Postgres running (e.g. via Docker):

```bash
docker compose up db
```

### API

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install ".[dev]"
alembic upgrade head
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Jobs

```bash
cd jobs
python3 -m venv .venv
source .venv/bin/activate
pip install ".[dev]"
celery -A src.celery_app worker --loglevel=info
```

### UI

```bash
cd ui
npm install
npm run dev
```

## Makefile Shortcuts

```bash
make up          # docker compose up --build
make api         # Start API server locally
make jobs        # Start job server locally
make ui          # Start UI dev server
make test        # Run all tests
make test-api    # Run API tests
make test-ui     # Run UI tests
make migrate     # Run migrations
make rollback    # Rollback last migration
```

## Project Structure

```
openhedgefund/
├── api/            # FastAPI application + DB migrations
├── jobs/           # Background job workers
├── ui/             # React frontend
├── infra/          # Terraform infrastructure
├── docker-compose.yml
└── Makefile
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
