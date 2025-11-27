"""
Application configuration management using Pydantic settings.
Handles environment variables, security settings, and database configuration.
"""

import os
from typing import List, Optional
from functools import lru_cache

from pydantic import BaseSettings, validator, SecretStr


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Application settings
    app_name: str = "FastAPI Production Backend"
    environment: str = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_hosts: List[str] = ["*"]

    # Database settings
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/fastapi_db"
    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_timeout: int = 30
    database_pool_recycle: int = 3600

    # Redis settings (for rate limiting and caching)
    redis_url: str = "redis://localhost:6379/0"
    redis_max_connections: int = 10

    # Security settings
    secret_key: SecretStr = SecretStr("your-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://yourdomain.com"
    ]

    # Rate limiting settings
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds

    # Logging settings
    log_level: str = "INFO"
    log_format: str = "json"

    # Monitoring settings
    enable_metrics: bool = True
    metrics_port: int = 8001

    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "text/plain"
    ]

    # Email settings (for notifications)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[SecretStr] = None
    smtp_use_tls: bool = True

    # External API settings
    api_timeout: int = 30
    api_retry_attempts: int = 3

    @validator("cors_origins", pre=True)
    def assemble_cors_origins(cls, v):
        """Parse CORS origins from environment variable."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @validator("allowed_hosts", pre=True)
    def assemble_allowed_hosts(cls, v):
        """Parse allowed hosts from environment variable."""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v

    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment setting."""
        if v not in ["development", "staging", "production"]:
            raise ValueError("Environment must be development, staging, or production")
        return v

    @validator("log_level")
    def validate_log_level(cls, v):
        """Validate log level setting."""
        if v.upper() not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
            raise ValueError("Invalid log level")
        return v.upper()

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"

    @property
    def database_echo(self) -> bool:
        """Enable database query logging in development."""
        return self.is_development and self.debug


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()