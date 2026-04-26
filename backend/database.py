from contextlib import contextmanager
from sqlmodel import SQLModel, Session, create_engine
import os

# SQLite for POC
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rms.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

def init_db():
    """Create all tables."""
    SQLModel.metadata.create_all(engine)

@contextmanager
def get_session():
    """Get database session."""
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def get_db():
    """FastAPI dependency for database session."""
    with get_session() as session:
        yield session
