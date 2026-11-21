from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET = "development-only-change-this-secret"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["development", "production"] = "development"
    database_url: str = "sqlite:///./fixmystreet.db"
    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = Field(default=60 * 24 * 7, ge=5)
    cors_origins: str = "*"
    seed_demo_data: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if len(settings.jwt_secret) < 16:
        raise RuntimeError("JWT_SECRET must be at least 16 characters")
    if settings.environment == "production" and settings.jwt_secret == DEFAULT_JWT_SECRET:
        raise RuntimeError("Set JWT_SECRET before running with ENVIRONMENT=production")
    return settings
