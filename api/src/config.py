from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+asyncpg://openhedgefund:localdev@localhost:5432/openhedgefund"
    )
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "CHANGE-ME-IN-PRODUCTION"
    access_token_lifetime_seconds: int = 86400  # 24 hours
    cors_origins: str = "http://localhost:3010"
    max_upload_size_mb: int = 1

    model_config = {"env_file": ".env"}


settings = Settings()
