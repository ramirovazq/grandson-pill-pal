#!/bin/bash
set -e

# Configuration
PG_DATA_DIR="/var/lib/postgresql/data"
PG_USER="pillpal"
PG_DB="pillpal"
PG_PASSWORD="${POSTGRES_PASSWORD:-pillpal_secret}"

echo "🚀 Starting Monolithic Container..."

# ==============================================================================
# 1. PostgreSQL Setup
# ==============================================================================

# Initialize PostgreSQL data directory if empty
if [ -z "$(ls -A "$PG_DATA_DIR")" ]; then
    echo "📦 Initializing Database..."
    mkdir -p "$PG_DATA_DIR"
    chown -R postgres:postgres "$PG_DATA_DIR"
    su - postgres -c "initdb -D $PG_DATA_DIR"
    
    echo "🔑 Configuring Users..."
    # Start temporarily to create user/db
    su - postgres -c "pg_ctl -D $PG_DATA_DIR -w start"
    
    su - postgres -c "psql -c \"CREATE USER $PG_USER WITH PASSWORD '$PG_PASSWORD';\""
    su - postgres -c "psql -c \"CREATE DATABASE $PG_DB OWNER $PG_USER;\""
    su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $PG_DB TO $PG_USER;\""
    
    su - postgres -c "pg_ctl -D $PG_DATA_DIR -m fast -w stop"
fi

# Start PostgreSQL in background
echo "🐘 Starting PostgreSQL..."
su - postgres -c "pg_ctl -D $PG_DATA_DIR -w start" &

# Wait for Postgres to be ready
until su - postgres -c "pg_isready"; do
  echo "Waiting for postgres..."
  sleep 2
done

# ==============================================================================
# 2. Database Migrations
# ==============================================================================
echo "🔄 Running Alembic Migrations..."
# Ensure DATABASE_URL is set correct for local unix socket or localhost
# Here we use localhost since pg is running on port 5432
export DATABASE_URL="postgresql+asyncpg://$PG_USER:$PG_PASSWORD@localhost:5432/$PG_DB"

# Run alembic upgrade
uv run alembic upgrade head

# ==============================================================================
# 3. Start Backend (with Frontend served statically)
# ==============================================================================
echo "🐍 Starting FastAPI Application..."
# Host 0.0.0.0 is important for docker mapping
exec uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
