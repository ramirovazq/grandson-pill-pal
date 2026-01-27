# Backend Development Guidelines

## Dependency Management

Use `uv` for Python dependency management:

```bash
uv sync              # Install dependencies
uv add <package>     # Add a new package
uv run python <file> # Run a Python file
uv run pytest        # Run tests
```

## Project Context

Grandson Pill Pal is a medication reminder app. The backend needs to:

1. **Accept prescriptions** from the frontend with medication items and phone numbers
2. **Store prescriptions** in a database (PostgreSQL recommended)
3. **Schedule reminders** to be sent via SMS at appropriate times
4. **Send SMS messages** using a service like Twilio
5. **Support i18n** - messages in English (en) and Spanish (es)

## API Specification

See `openapi.yaml` for the complete OpenAPI 3.0 specification.

Key endpoints:
- `POST /api/v1/prescriptions` - Create prescription with medication items
- `GET /api/v1/prescriptions` - List prescriptions
- `GET/PUT/DELETE /api/v1/prescriptions/{id}` - CRUD operations
- `GET /api/v1/health` - Health check

## Tech Stack (Recommended)

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy or SQLModel
- **SMS**: Twilio
- **Task Queue**: Celery or APScheduler for scheduled reminders
- **Validation**: Pydantic

## Development Practices

- Write tests for all endpoints
- Use type hints throughout
- Follow the OpenAPI spec in `openapi.yaml`
- Commit code regularly to git
- Keep environment variables in `.env` (not committed)