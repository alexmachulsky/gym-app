from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Smart Gym Progress Tracker'
    database_url: str = 'sqlite+pysqlite:///./gym_tracker.db'
    secret_key: str = 'change-me-in-production'
    access_token_expire_minutes: int = 60
    algorithm: str = 'HS256'
    log_level: str = 'INFO'
    frontend_origin: str = 'http://localhost:5173'
    frontend_origins: str = 'http://localhost:5173,http://127.0.0.1:5173'

    def get_frontend_origins(self) -> list[str]:
        if self.frontend_origins.strip():
            return [origin.strip() for origin in self.frontend_origins.split(',') if origin.strip()]
        return [self.frontend_origin]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
