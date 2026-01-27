"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    app_name: str = "Grandson Pill Pal API"
    app_version: str = "1.0.0"
    debug: bool = False

    # API settings
    api_prefix: str = "/api/v1"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # CORS settings
    cors_origins: str = "*"  # Comma-separated list or "*" for all

    # Database settings
    # For SQLite (development): sqlite+aiosqlite:///./pillpal.db
    # For PostgreSQL (production): postgresql+asyncpg://user:pass@host:port/dbname
    database_url: str = "sqlite+aiosqlite:///./pillpal.db"

    # Twilio settings (for future use)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins into a list."""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
