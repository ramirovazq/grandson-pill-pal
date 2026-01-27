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

    # Database settings
    database_url: str = "sqlite+aiosqlite:///./pillpal.db"

    # Twilio settings (for future use)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""


settings = Settings()
