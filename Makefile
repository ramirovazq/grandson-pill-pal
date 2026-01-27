# Grandson Pill Pal - Makefile
# ============================
# Convenient commands for development

.PHONY: help install install-frontend install-backend \
        dev dev-frontend dev-backend \
        test test-all test-frontend test-backend test-integration test-watch \
        build lint clean

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
	@echo "Development:"
	@echo "  make dev              - Run both frontend and backend dev servers"
	@echo "  make dev-frontend     - Run frontend dev server (port 5173)"
	@echo "  make dev-backend      - Run backend dev server (port 8000)"
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
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:8000"
	@echo "API Docs: http://localhost:8000/api/v1/docs"
	@echo ""
	@make -j2 dev-frontend dev-backend

dev-frontend:
	@echo "🌐 Starting frontend dev server..."
	cd frontend && npm run dev

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
