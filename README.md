# Grandson Pill Pal

A medication reminder application that helps loved ones (especially grandparents) remember to take their pills on time.

## Features

- Create prescriptions with multiple medication items
- Schedule SMS reminders to be sent at appropriate times
- Multi-language support (English and Spanish)
- Flexible scheduling with customizable reminder times

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │   SMS Service   │
│  (React/Vite)   │────▶│    (FastAPI)    │────▶│    (Twilio)     │
│    + Nginx      │     │    + Python     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    Database     │
                        │  (PostgreSQL)   │
                        └─────────────────┘
```

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Query (state management)
- Nginx (production server)

**Backend:**
- FastAPI (Python)
- SQLAlchemy (async ORM)
- PostgreSQL / SQLite
- Pydantic (validation)

**Infrastructure:**
- Docker + Docker Compose
- PostgreSQL 16

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd grandson-pill-pal

# Copy environment variables
cp .env.example .env

# Start all services
make docker-up

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
```

### Local Development

```bash
# Install dependencies
make install

# Start development servers
make dev

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
```

## Available Commands

Run `make help` to see all available commands:

```
Installation:
  make install          - Install all dependencies (frontend + backend)
  make install-frontend - Install frontend dependencies
  make install-backend  - Install backend dependencies

Development (Local):
  make dev              - Run both frontend and backend dev servers
  make dev-frontend     - Run frontend dev server (port 5173)
  make dev-backend      - Run backend dev server (port 8000)

Docker:
  make docker-up        - Start all services (frontend + backend + postgres)
  make docker-down      - Stop all services
  make docker-build     - Build Docker images
  make docker-logs      - View logs from all services
  make docker-ps        - Show running containers
  make docker-dev-up    - Start development database (postgres only)
  make docker-dev-down  - Stop development database

Testing:
  make test             - Run unit tests (frontend + backend)
  make test-all         - Run all tests (unit + integration)
  make test-frontend    - Run frontend unit tests
  make test-backend     - Run backend unit tests
  make test-integration - Run backend integration tests
  make test-watch       - Run frontend tests in watch mode

Build:
  make build            - Build frontend for production
  make build-dev        - Build frontend for development

Cleanup:
  make clean            - Remove build artifacts and caches
  make docker-clean     - Remove Docker volumes and images
```

## Project Structure

```
grandson-pill-pal/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── pages/            # Page components
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                  # FastAPI backend
│   ├── src/
│   │   ├── db/               # Database models & repository
│   │   ├── models/           # Pydantic models
│   │   └── routers/          # API endpoints
│   ├── tests/                # Unit tests
│   ├── tests_integration/    # Integration tests
│   ├── Dockerfile
│   └── openapi.yaml          # API specification
├── docker-compose.yml        # Production setup
├── docker-compose.dev.yml    # Development database
└── Makefile                  # Task automation
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `pillpal` |
| `POSTGRES_PASSWORD` | PostgreSQL password | (set a secure password) |
| `POSTGRES_DB` | PostgreSQL database name | `pillpal` |
| `DEBUG` | Enable debug mode | `false` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | (optional) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | (optional) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | (optional) |

## API Documentation

When the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## Testing

The project includes comprehensive tests:

- **Frontend Unit Tests**: 68 tests (Vitest + React Testing Library)
- **Backend Unit Tests**: 42 tests (pytest)
- **Backend Integration Tests**: 30 tests (pytest + SQLite)

```bash
# Run all tests
make test-all

# Run specific test suites
make test-frontend
make test-backend
make test-integration
```

## License

MIT
