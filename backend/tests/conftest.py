import pytest
import pytest_asyncio
from backend.app.persistence.database import init_db

@pytest_asyncio.fixture(autouse=True, scope="function")
async def setup_test_db():
    await init_db()
