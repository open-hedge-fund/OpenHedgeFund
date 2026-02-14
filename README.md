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

## Quick Start

```bash
# Clone the repo
git clone https://github.com/open-hedge-fund/OpenHedgeFund.git
cd OpenHedgeFund

# Start all services locally
make up

# Run database migrations
make migrate

# Seed development data
make seed
```

## Development

```bash
# Start individual services
make api        # Start API server
make jobs       # Start job server
make ui         # Start UI dev server

# Run tests
make test       # Run all tests
make test-api   # Run API tests
make test-ui    # Run UI tests

# Database
make migrate    # Run migrations
make rollback   # Rollback last migration
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
