from fastapi.testclient import TestClient
import pytest
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel

from app.db.session import get_db
from app.main import app


TEST_DATABASE_NAME = "test_assessment_db"

@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        # Create and spin up test database with postgres for similar prod results
        # All tables should be automatically dropped after test
        f"postgresql+psycopg://assessment_user:assessment_pass@localhost:5432/{TEST_DATABASE_NAME}",
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, future=True
    )

    SQLModel.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(bind=engine)
