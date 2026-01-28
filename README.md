# grandson-pill-pal

This repository aims to generate an application that helps loved ones (especially grandparents) remember to take their pills on time.

# Grandson Pill Pal

---
## Index

- 1.[Description of the problem](#1-description-of-the-problem)
- 2.[Objective](#2-objective)
- 3.[AI System Development](#3-ai-system-development)
- 4.[Technologies and system architecture](#4-technologies-and-system-architecture)
- 5.[Front-end implementation](#5-front-end-implementation)
- 6.[API contract (OpenAPI specifications)](#6-api-contract-openapi-specifications)
- 7.[Back-end implementation](#7-back-end-implementation)
- 8.[Database integration ](#8-database-integration)
- 9.[Containerization and deployment](#9-containerization-and-deployment)
- 10.[Integration testing](#10-integration-testing)
- 11.[Deployment  ](#11-deployment)
- 12.[Reproducibility   ](#12-reproducibility)

## 1. Description of the problem

<p align="justify">
In recent years, technological advancement has accelerated significantly, along with the proliferation of digital tools and applications. However, this rapid growth has also widened the gap in technology usage among older adults, as many of them either refrain from adopting new technologies or are limited to basic functionalities. This digital divide poses challenges to their autonomy and access to services that increasingly rely on digital platforms.
</p>

<p align="justify">
In this context, developing applications specifically designed to support essential daily activities for older adults represents an opportunity to improve their quality of life. By involving close family members—such as children, grandchildren, or caregivers—in the use and management of these applications, it becomes possible to create a supportive technological ecosystem that promotes inclusion, assistance, and a stronger connection between older adults and their immediate support network.
</p>

## 2. Objective

<p align="justify">
Develop a data architecture capable of ingesting historical data on traffic incidents in Mexico City, starting from 2014 (https://datos.cdmx.gob.mx/dataset/incidentes-viales-c5) up to the most recent available records. This architecture should support data ingestion, processing, and analysis. The final product should be a visual dashboard highlighting the days and hours with the highest incidence, the top neighborhoods with the most reported incidents, and offer interactive insights into categories and frequency patterns within the data.
</p>

## 3. AI System Development


<p align="justify"> The development of this application was strongly supported by the use of AI-powered coding assistants, primarily <strong>Antigravity</strong> and <strong>Cursor</strong>, which were used throughout the design, implementation, and deployment phases of the project. These tools enabled faster iteration, code validation, and architectural decision-making. </p> <p align="justify"> The development process followed an iterative and AI-assisted workflow, structured as follows: </p>

1. Initial Frontend Generation
The frontend was initially generated using a prompt-driven approach. A high-level prompt was used to define the core user experience, focusing on a health-oriented web service (mobile-friendly) that allows users to input medical prescriptions through a central text field. The interface was intentionally designed to be friendly and approachable, targeting younger users who assist older adults in following medical prescriptions.

2. Iterative Frontend Refinement
The frontend was refined iteratively using additional prompts to introduce usability and accessibility improvements. These iterations included features such as bilingual support (English and Spanish), a language switcher, and dark mode support. Further refinements introduced a multi-step flow where users are required to validate each extracted prescription item before proceeding.

3. Frontend Validation and AI Integration Design
Once the frontend structure was stabilized, it was connected to a source code repository and integrated with coding assistants. At this stage, unit tests were introduced for the frontend to ensure correctness and stability. Based on the validated frontend flow, API specifications were generated to align backend behavior with the expected application workflow.

4. Prompt Engineering and AI Behavior Prototyping
To validate the AI-driven prescription parsing logic, a Jupyter Notebook was created using a set of real-world medical prescriptions as input examples. Prompt engineering was performed iteratively to achieve accurate medication extraction and structuring. ChatGPT was used in parallel to clarify agent behavior and refine the prompt logic for consistent and reliable outputs.

5. Backend Development and Data Persistence
Backend development was initiated based on the previously defined API specifications. The system initially used SQLite for rapid prototyping and was later migrated to PostgreSQL to support scalability and production-readiness. Unit tests were continuously added throughout this phase to ensure functional correctness at each development step.

6. Containerization and Deployment Preparation
AI coding assistants were used to containerize the entire application, ensuring consistency across environments. Finally, the assistants supported the generation of deployment configuration files, enabling the project to be prepared for production deployment.


## 4. Technologies and system architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │   SMS Service   │
│  (React/Vite)   │────▶│    (FastAPI)    │────▶│    (Twilio)     │
│    + Nginx      │     │    + Python     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             ┌─────────────┐       ┌─────────────┐
             │  Database   │       │  Extractor  │
             │ (PostgreSQL)│       │  (OpenAI)   │
             └─────────────┘       └─────────────┘
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

**Extractor Service:**
- FastAPI microservice
- OpenAI GPT-4o-mini
- Prescription text analysis

**Infrastructure:**
- Docker + Docker Compose
- PostgreSQL 16

## 5. Front-end implementation

<p align="justify">
The frontend serves as the primary user interface for the Grandson Pill Pal application. It was designed with a mobile-first approach. The implementation follows modern React patterns and establishes a clear contract with the backend through OpenAPI specifications.
</p>

### 5.1 Technology Stack

The frontend was built using:

- **React 18 + TypeScript**: Type-safe component development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first styling framework
- **shadcn/ui**: Accessible component library
- **React Query**: Server state management and API integration
- **React Router DOM**: Client-side routing
- **Vitest + React Testing Library**: Comprehensive unit testing

### 5.2 Architecture and Design Patterns

The frontend follows a structured architecture:

```
frontend/src/
├── api/              # API client and type definitions (OpenAPI-based)
├── components/       # Reusable React components
│   └── ui/          # shadcn/ui components
├── contexts/        # React Context providers (Language)
├── hooks/           # Custom React hooks (API integration)
├── pages/           # Page-level components
└── lib/             # Utility functions
```

**Key Design Decisions:**

1. **API Contract First**: All API types (`api/types.ts`) are directly derived from the OpenAPI specification, ensuring frontend-backend alignment
2. **Component Composition**: Modular components with clear responsibilities
3. **Context for Global State**: Language preferences managed via React Context
4. **Custom Hooks for Data**: API integration abstracted into reusable hooks

### 5.3 API Integration via OpenAPI Contract

The frontend strictly adheres to the OpenAPI specification defined in `backend/openapi.yaml`:

**Type Generation:**
```typescript
// frontend/src/api/types.ts
export interface CreatePrescriptionRequest {
  phone_number: string;
  items: PrescriptionItemInput[];
  language?: Language;
  timezone?: string;
  recipient_name?: string;
}

export interface PrescriptionItemInput {
  text: string;
  item_type?: ItemType;
  item_name?: string;
  item_name_complete?: string;
  pills_per_dose?: number | null;
  doses_per_day?: number | null;
  treatment_duration_days?: number | null;
  total_pills_required?: number | null;
  raw_prescription_text?: string;
  confidence_level?: ConfidenceLevel;
  requires_human_review?: boolean;
  schedule?: ReminderSchedule;
}
```

**API Client:**
```typescript
// frontend/src/api/client.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = {
  async createPrescription(data: CreatePrescriptionRequest): Promise<Prescription> {
    const response = await fetch(`${API_URL}/api/v1/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create prescription');
    return response.json();
  },
  // ... other methods
};
```

**React Query Integration:**
```typescript
// frontend/src/hooks/usePrescriptions.ts
export function useCreatePrescription() {
  return useMutation({
    mutationFn: (data: CreatePrescriptionRequest) => 
      apiClient.createPrescription(data),
    onSuccess: () => {
      // Handle success
    },
  });
}
```

### 5.4 Key Features Implementation

**Internationalization (i18n)**
- `LanguageContext` provides translations
- Support for English and Spanish
- Dynamic language switching without page reload

**Responsive Design**
- Mobile-first approach
- Tailwind responsive utilities (sm:, md:, lg:)
- Touch-friendly interfaces

**Accessibility**
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Color contrast compliant

**Form Validation**
- Required field validation
- Phone number format validation
- Item validation requirements
- User feedback via toasts

**AI Integration**
- Prescription extraction via external microservice
- Loading states during AI processing
- Confidence level indicators
- Debug panel for development/troubleshooting

### 5.5 Build and Deployment

**Development:**
```bash
make dev-frontend     # Vite dev server on port 5173
```

**Production Build:**
```bash
make build            # Generates optimized bundle in dist/
```

**Docker Container:**
- Frontend served by Nginx
- Optimized for production with gzip compression
- SPA routing configured
- Environment variables for API URLs

**Environment Configuration:**
```bash
VITE_API_URL=http://localhost:8000          # Backend API
VITE_EXTRACTOR_URL=http://localhost:8001    # AI Extractor service
```

## Features

- Create prescriptions with multiple medication items
- Schedule SMS reminders to be sent at appropriate times
- Multi-language support (English and Spanish)
- Flexible scheduling with customizable reminder times



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
│   │   ├── routers/          # API endpoints
│   │   └── services/         # Microservices (extractor)
│   ├── tests/                # Unit tests
│   ├── tests_integration/    # Integration tests
│   ├── Dockerfile            # Backend Dockerfile
│   ├── Dockerfile.extractor  # Extractor service Dockerfile
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
| `OPENAI_API_KEY` | OpenAI API key for prescription extraction | (required for extractor) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | (optional) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | (optional) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | (optional) |

## API Documentation

When services are running, access the interactive API documentation:

- **Backend Swagger UI**: http://localhost:8000/api/v1/docs
- **Backend ReDoc**: http://localhost:8000/api/v1/redoc
- **Extractor Swagger UI**: http://localhost:8001/docs

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
