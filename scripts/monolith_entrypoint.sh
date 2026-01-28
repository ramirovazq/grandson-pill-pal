#!/bin/bash
set -e

# Configuration
PG_DATA_DIR="/var/lib/postgresql/data"
PG_USER="pillpal"
PG_DB="pillpal"
PG_PASSWORD="${POSTGRES_PASSWORD:-pillpal_secret}"
USE_EXTERNAL_DB="${EXTERNAL_DATABASE:-false}"

echo "🚀 Starting Monolithic Container..."

# ==============================================================================
# 1. PostgreSQL Setup (Only if NOT using external DB)
# ==============================================================================

if [ "$USE_EXTERNAL_DB" = "true" ]; then
    echo "🌍 Using External Database. Skipping local PostgreSQL startup."
    # We expect DATABASE_URL to be set by the environment (Render)
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ Error: EXTERNAL_DATABASE is true but DATABASE_URL is not set!"
        exit 1
    fi
else
    # Initialize PostgreSQL data directory if empty (or if using Persistent Disk on first run)
    # Check if directory is empty or doesn't exist
    if [ ! -d "$PG_DATA_DIR" ] || [ -z "$(ls -A "$PG_DATA_DIR")" ]; then
        echo "📦 Initializing Database..."
        mkdir -p "$PG_DATA_DIR"
        chown -R postgres:postgres "$PG_DATA_DIR"
        # Only initdb if PG_VERSION doesn't exist (robustness)
        if [ ! -f "$PG_DATA_DIR/PG_VERSION" ]; then
             su - postgres -c "initdb -D $PG_DATA_DIR"
        
            echo "🔑 Configuring Users..."
            # Start temporarily to create user/db
            su - postgres -c "pg_ctl -D $PG_DATA_DIR -w start"
            
            su - postgres -c "psql -c \"CREATE USER $PG_USER WITH PASSWORD '$PG_PASSWORD';\""
            su - postgres -c "psql -c \"CREATE DATABASE $PG_DB OWNER $PG_USER;\""
            su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $PG_DB TO $PG_USER;\""
            
            su - postgres -c "pg_ctl -D $PG_DATA_DIR -m fast -w stop"
        fi
    fi

    # Start PostgreSQL in background
    echo "🐘 Starting Local PostgreSQL..."
    # Ensure ownership (sometimes volume mounts mess this up)
    chown -R postgres:postgres "$PG_DATA_DIR"
    chmod 0700 "$PG_DATA_DIR"
    
    su - postgres -c "pg_ctl -D $PG_DATA_DIR -w start" &

    # Wait for Postgres to be ready
    until su - postgres -c "pg_isready"; do
      echo "Waiting for postgres..."
      sleep 2
    done
    
    # Set DATABASE_URL for the app to connect locally
    export DATABASE_URL="postgresql+asyncpg://$PG_USER:$PG_PASSWORD@localhost:5432/$PG_DB"
fi

# ==============================================================================
# 2. Database Migrations
# ==============================================================================
echo "🔄 Running Alembic Migrations..."
echo "Database URL: $DATABASE_URL"

# Run alembic upgrade
uv run alembic upgrade head

# ==============================================================================
# 3. Start Backend (with Frontend served statically)
# ==============================================================================
echo "🐍 Starting FastAPI Application..."
# Host 0.0.0.0 is important for docker mapping
# Port defaults to 8000, but Render expects us to listen on PORT env var usually (default 10000).
# We should map Render PORT to uvicorn port.
PORT="${PORT:-8000}"
echo "Listening on port $PORT"
exec uv run uvicorn src.main:app --host 0.0.0.0 --port "$PORT"
