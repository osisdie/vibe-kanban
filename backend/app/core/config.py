from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_VERSION: str = "dev"
    DATABASE_URL: str = "sqlite+aiosqlite:///./vibe_kanban.db"
    JWT_SECRET_KEY: str = "change-me-to-a-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8004/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5177"
    API_V1_PREFIX: str = "/api/v1"
    EMAIL_PROVIDER: str = "smtp"  # "smtp" or "resend"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_APP_PASSWORD: str = ""
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = ""

    # Rate limiting (slowapi format: "count/period")
    RATE_LIMIT_DEFAULT: str = "60/minute"
    RATE_LIMIT_REGISTER: str = "1/3minutes"
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_FORGOT_PASSWORD: str = "3/hour"
    RATE_LIMIT_RESET_PASSWORD: str = "5/hour"
    RATE_LIMIT_CHANGE_PASSWORD: str = "5/minute"
    RATE_LIMIT_GOOGLE_AUTH: str = "10/minute"
    RATE_LIMIT_EXTERNAL: str = "60/minute"
    RATE_LIMIT_ADMIN: str = "30/minute"
    RATE_LIMIT_RESEND_VERIFICATION: str = "3/hour"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
