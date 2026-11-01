from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Beehive Monitor API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "beemonitor"
    DATABASE_URL: str | None = None

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Device Freshness / Alerts defaults
    STALE_THRESHOLD_SECONDS: int = 30
    OFFLINE_THRESHOLD_SECONDS: int = 120

    # Brood nest temperature defaults in Celsius
    DEFAULT_TEMP_MIN: float = 32.0
    DEFAULT_TEMP_MAX: float = 36.0

    # Hive relative humidity defaults in percentage
    DEFAULT_HUMIDITY_MIN: float = 50.0
    DEFAULT_HUMIDITY_MAX: float = 70.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            # Handle standard postgres:// to postgresql:// normalization
            if self.DATABASE_URL.startswith("postgres://"):
                return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
            return self.DATABASE_URL
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()

