"""
Mohiyat AI — Configuration & Environment Variables
===================================================
All secrets are injected via HF Spaces environment variables.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Mohiyat AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # LLM
    GOOGLE_API_KEY: str

    # Models (MVP: only Gemini)
    MODEL_FREEMIUM: str = "gemini-3-flash-preview"
    MODEL_PREMIUM: str = "gemini-3.1-pro-preview"

    # Limits
    MAX_FILE_SIZE_MB: int = 10
    MAX_PAGES_FREE: int = 1
    MAX_PAGES_PAID: int = 50
    REQUEST_TIMEOUT_SECONDS: int = 60

    # Payments
    PAYME_MERCHANT_KEY: str = ""
    CLICK_SERVICE_ID: str = ""
    CLICK_SECRET_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
