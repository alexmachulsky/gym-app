from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Smart Gym Progress Tracker'
    database_url: str = 'sqlite+pysqlite:///./gym_tracker.db'
    secret_key: str = 'change-me-in-production'
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    trial_days: int = 14
    algorithm: str = 'HS256'

    @field_validator('algorithm')
    @classmethod
    def validate_algorithm(cls, v: str) -> str:
        allowed = {'HS256', 'HS384', 'HS512'}
        if v not in allowed:
            raise ValueError(f"JWT algorithm must be one of {allowed}")
        return v

    log_level: str = 'INFO'
    frontend_origin: str = 'http://localhost:5173'
    frontend_origins: str = 'http://localhost:5173,http://127.0.0.1:5173'
    groq_api_key: str = ''
    groq_model: str = 'llama-3.3-70b-versatile'

    # Stripe billing
    stripe_secret_key: str = ''
    stripe_publishable_key: str = ''
    stripe_webhook_secret: str = ''
    stripe_pro_monthly_price_id: str = ''
    stripe_pro_yearly_price_id: str = ''

    # Email (Resend)
    resend_api_key: str = ''
    from_email: str = 'noreply@forgemode.app'

    # App URL for links in emails / Stripe redirects
    app_url: str = 'http://localhost:5173'

    # Sentry
    sentry_dsn: str = ''

    # Metrics API key (empty = metrics endpoint disabled/blocked)
    metrics_api_key: str = ''

    # Cookie security settings
    cookie_secure: bool = True
    cookie_samesite: str = 'lax'

    def get_frontend_origins(self) -> list[str]:
        if self.frontend_origins.strip():
            return [origin.strip() for origin in self.frontend_origins.split(',') if origin.strip()]
        return [self.frontend_origin]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
