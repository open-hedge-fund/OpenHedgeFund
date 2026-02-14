# Contributing to OpenHedgeFund

Thanks for your interest in contributing! This document outlines the process for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/OpenHedgeFund.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run tests: `make test`
6. Commit with a clear message
7. Push to your fork and open a pull request

## Development Setup

```bash
# Start the full local environment
make up

# Or run individual services
make api
make ui
make jobs
```

## Code Style

- **Python**: Follow PEP 8. We use `ruff` for linting and formatting.
- **TypeScript/JavaScript**: We use `eslint` and `prettier`.
- **Terraform**: Run `terraform fmt` before committing.

## Pull Request Process

1. Update documentation if you're changing behavior
2. Add tests for new functionality
3. Ensure all tests pass
4. Keep PRs focused — one feature or fix per PR

## Reporting Issues

Open an issue on GitHub with:
- A clear title and description
- Steps to reproduce (if it's a bug)
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license.
