from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import SQLModel, create_engine
import os

from routers import auth, product_groups, requirements

# Database setup - SQLite for demo
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rms.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

def create_tables():
    SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(
    title="Requirements Management System",
    description="API for managing product requirements",
    version="0.1.0",
    lifespan=lifespan
)

# CORS - allow all for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(product_groups.router)
app.include_router(requirements.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
