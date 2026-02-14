from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://openhedgefund:localdev@localhost:5432/openhedgefund"
    redis_url: str = "redis://localhost:6379/0"

    model_config = {"env_file": ".env"}


settings = Settings()
