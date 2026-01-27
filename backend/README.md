# Grandson Pill Pal Backend API

Backend service for Grandson Pill Pal - A medication reminder application that helps loved ones (especially grandparents) remember to take their pills on time.

## Overview

This API provides endpoints for:
- Creating and managing prescriptions with medication items
- Scheduling SMS reminders to be sent to specified phone numbers
- Managing reminder schedules and statuses

## API Documentation

The API is documented using OpenAPI 3.0 specification. See [openapi.yaml](./openapi.yaml) for the full specification.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/prescriptions` | Create a new prescription |
| GET | `/api/v1/prescriptions` | List all prescriptions |
| GET | `/api/v1/prescriptions/{id}` | Get a specific prescription |
| PUT | `/api/v1/prescriptions/{id}` | Update a prescription |
| DELETE | `/api/v1/prescriptions/{id}` | Delete a prescription |
| PATCH | `/api/v1/prescriptions/{id}/status` | Update prescription status |
| GET | `/api/v1/prescriptions/{id}/reminders` | Get reminders for a prescription |

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │   SMS Service   │
│   (React App)   │────▶│   (Python API)  │────▶│   (e.g. Twilio) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    Database     │
                        │  (PostgreSQL)   │
                        └─────────────────┘
```

## Development Setup

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) for dependency management

### Getting Started

```bash
# Install dependencies
uv sync

# Run the development server
uv run python -m uvicorn main:app --reload --port 8000

# Or run with a specific file
uv run python <python-file>
```

### Adding Dependencies

```bash
uv add <package_name>
```

### Running Tests

```bash
# Run all tests
uv run pytest

# Run tests with verbose output
uv run pytest -v

# Run a specific test file
uv run pytest tests/test_prescriptions.py

# Run tests with coverage (requires pytest-cov)
uv run pytest --cov=src
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - |
| `TWILIO_PHONE_NUMBER` | Twilio phone number to send from | - |
| `API_HOST` | Host to bind the server to | `0.0.0.0` |
| `API_PORT` | Port to run the server on | `8000` |
| `LOG_LEVEL` | Logging level | `INFO` |

## API Request/Response Examples

### Create a Prescription

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+15551234567",
    "items": [
      {"text": "Take 1 blue pill every morning with food"},
      {"text": "Take 2 white pills at night before bed"}
    ],
    "language": "en",
    "recipient_name": "Grandma Rose"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone_number": "+15551234567",
  "items": [
    {
      "id": "item-1",
      "text": "Take 1 blue pill every morning with food"
    },
    {
      "id": "item-2", 
      "text": "Take 2 white pills at night before bed"
    }
  ],
  "language": "en",
  "recipient_name": "Grandma Rose",
  "status": "active",
  "created_at": "2026-01-26T12:00:00Z",
  "updated_at": "2026-01-26T12:00:00Z"
}
```

## Frontend Integration

The frontend sends prescription data in the following format:

```typescript
interface PrescriptionSubmission {
  prescription: string;  // Joined medication items with ". "
  phone: string;         // Phone number for reminders
}
```

The backend should parse the prescription string into individual items or accept an array of items directly.

## Project Structure (Recommended)

```
backend/
├── AGENTS.md
├── README.md
├── openapi.yaml
├── pyproject.toml
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration management
│   ├── models/              # Pydantic models & DB models
│   │   ├── __init__.py
│   │   ├── prescription.py
│   │   └── reminder.py
│   ├── routers/             # API route handlers
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── prescriptions.py
│   │   └── reminders.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── prescription_service.py
│   │   ├── reminder_service.py
│   │   └── sms_service.py
│   └── db/                  # Database utilities
│       ├── __init__.py
│       └── connection.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── test_prescriptions.py
```

## License

MIT
