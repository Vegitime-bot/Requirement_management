from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db
from .routers import auth, product_groups, requirements

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
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

# Include routers
app.include_router(auth.router)
app.include_router(product_groups.router)
app.include_router(requirements.router)

@app.get("/")
def root():
    return {
        "service": "Requirements Management System",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "auth": "/auth/me",
            "product_groups": "/product-groups",
            "requirements": "/requirements"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}
