# Grandson Pill Pal - Makefile
# ============================
# Convenient commands for development

.PHONY: help install install-frontend install-backend \
        dev dev-frontend dev-backend dev-extractor \
        test test-all test-frontend test-backend test-integration test-watch \
        build lint clean \
        docker-up docker-down docker-build docker-logs docker-ps \
        docker-dev-up docker-dev-down

# Default target
help:
	@echo "Grandson Pill Pal - Available Commands"
	@echo "======================================"
	@echo ""
	@echo "Installation:"
	@echo "  make install          - Install all dependencies (frontend + backend)"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make install-backend  - Install backend dependencies"
	@echo ""
	@echo "Development (Local):"
	@echo "  make dev              - Run all dev servers (frontend + backend + extractor)"
	@echo "  make dev-frontend     - Run frontend dev server (port 5173)"
	@echo "  make dev-backend      - Run backend dev server (port 8000)"
	@echo "  make dev-extractor    - Run prescription extractor service (port 8001)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        - Start all services (frontend + backend + postgres)"
	@echo "  make docker-down      - Stop all services"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-logs      - View logs from all services"
	@echo "  make docker-ps        - Show running containers"
	@echo "  make docker-dev-up    - Start development database (postgres only)"
	@echo "  make docker-dev-down  - Stop development database"
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run unit tests (frontend + backend)"
	@echo "  make test-all         - Run all tests (unit + integration)"
	@echo "  make test-frontend    - Run frontend unit tests"
	@echo "  make test-backend     - Run backend unit tests"
	@echo "  make test-integration - Run backend integration tests"
	@echo "  make test-watch       - Run frontend tests in watch mode"
	@echo ""
	@echo "Build:"
	@echo "  make build            - Build frontend for production"
	@echo "  make build-dev        - Build frontend for development"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             - Run linters (frontend)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Remove build artifacts and caches"
	@echo "  make docker-clean     - Remove Docker volumes and images"

# ============================================================================
# Installation
# ============================================================================

install: install-frontend install-backend
	@echo "✅ All dependencies installed"

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

install-backend:
	@echo "📦 Installing backend dependencies..."
	cd backend && uv sync

# ============================================================================
# Development Servers
# ============================================================================

dev:
	@echo "🚀 Starting development servers..."
	@echo "Frontend:  http://localhost:5173"
	@echo "Backend:   http://localhost:8000"
	@echo "Extractor: http://localhost:8001"
	@echo "API Docs:  http://localhost:8000/api/v1/docs"
	@echo ""
	@make -j3 dev-frontend dev-backend dev-extractor

dev-frontend:
	@echo "🌐 Starting frontend dev server..."
	cd frontend && npm run dev

dev-extractor:
	@echo "🤖 Starting prescription extractor service..."
	cd backend && uv run python -m src.services.prescription_extractor

dev-backend:
	@echo "🐍 Starting backend dev server..."
	cd backend && uv run uvicorn src.main:app --reload --port 8000

# ============================================================================
# Testing
# ============================================================================

test: test-backend test-frontend
	@echo "✅ All tests completed"

test-all: test-backend test-integration test-frontend
	@echo "✅ All tests (unit + integration) completed"

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test

test-backend:
	@echo "🧪 Running backend unit tests..."
	cd backend && uv run pytest tests/ -v

test-integration:
	@echo "🔗 Running backend integration tests..."
	cd backend && uv run pytest tests_integration/ -v

test-watch:
	@echo "🔄 Running frontend tests in watch mode..."
	cd frontend && npm run test:watch

# ============================================================================
# Build
# ============================================================================

build:
	@echo "🏗️  Building frontend for production..."
	cd frontend && npm run build

build-dev:
	@echo "🏗️  Building frontend for development..."
	cd frontend && npm run build:dev

# ============================================================================
# Code Quality
# ============================================================================

lint:
	@echo "🔍 Running linters..."
	cd frontend && npm run lint

# ============================================================================
# Cleanup
# ============================================================================

clean:
	@echo "🧹 Cleaning up..."
	# Frontend
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf frontend/.vite
	# Backend
	rm -rf backend/.venv
	rm -rf backend/__pycache__
	rm -rf backend/src/__pycache__
	rm -rf backend/tests/__pycache__
	rm -rf backend/.pytest_cache
	rm -rf backend/*.egg-info
	@echo "✅ Cleanup complete"

# ============================================================================
# Docker
# ============================================================================

docker-up:
	@echo "🐳 Starting all services..."
	docker compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost"
	@echo "   Backend:  http://localhost:8000"
	@echo "   API Docs: http://localhost:8000/api/v1/docs"

docker-down:
	@echo "🐳 Stopping all services..."
	docker compose down

docker-build:
	@echo "🐳 Building Docker images..."
	docker compose build

docker-logs:
	docker compose logs -f

docker-ps:
	docker compose ps

docker-dev-up:
	@echo "🐳 Starting development database..."
	docker compose -f docker-compose.dev.yml up -d db
	@echo ""
	@echo "✅ PostgreSQL started!"
	@echo "   Host: localhost:5434"
	@echo "   User: pillpal"
	@echo "   Pass: pillpal_dev"
	@echo "   DB:   pillpal_dev"
	@echo ""
	@echo "Connection string for backend:"
	@echo "   DATABASE_URL=postgresql+asyncpg://pillpal:pillpal_dev@localhost:5434/pillpal_dev"

docker-dev-down:
	@echo "🐳 Stopping development database..."
	docker compose -f docker-compose.dev.yml down

docker-clean:
	@echo "🐳 Cleaning Docker resources..."
	docker compose down -v --rmi local
	docker compose -f docker-compose.dev.yml down -v
	@echo "✅ Docker cleanup complete"

# ============================================================================
# Additional Utilities
# ============================================================================

# Preview production build
preview:
	@echo "👀 Previewing production build..."
	cd frontend && npm run preview

# Add a new backend dependency
add-backend-dep:
	@read -p "Package name: " pkg; \
	cd backend && uv add $$pkg

# Add a new frontend dependency
add-frontend-dep:
	@read -p "Package name: " pkg; \
	cd frontend && npm install $$pkg
