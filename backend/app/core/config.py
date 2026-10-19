import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "CausalOpsDB-X"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    CACHE_DIR: Path = DATA_DIR / "cache"
    RAW_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    FIXTURES_DIR: Path = DATA_DIR / "fixtures"
    
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR / 'causalopsdb.sqlite3'}"
    SYNC_DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'causalopsdb.sqlite3'}"
    
    BENCHMARK_BASE_URL: str = "https://huggingface.co/datasets/phamquiluan/RCAEval/resolve/main"
    BENCHMARK_API_URL: str = "https://huggingface.co/api/datasets/phamquiluan/RCAEval/tree/main"
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure directories exist
for folder in [settings.DATA_DIR, settings.CACHE_DIR, settings.RAW_DIR, settings.PROCESSED_DIR, settings.FIXTURES_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
