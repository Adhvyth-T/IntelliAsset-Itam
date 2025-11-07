from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

from config import CORS_ORIGINS
from database import startup_db_client, shutdown_db_client, get_database
from routes import (
    auth_router, assets_router, users_router, procurement_router,
    analytics_router, audit_router, agent_router
)
from utils import asset_helper
from auth import get_current_user
from models import UserResponse

# Import scanner API if available
try:
    from scanner_api_simple import create_scanner_router
    SCANNER_AVAILABLE = True
except ImportError:
    SCANNER_AVAILABLE = False
    print("Warning: scanner_api_simple not found. Scanner functionality will be disabled.")

# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await startup_db_client()
    yield
    # Shutdown
    await shutdown_db_client()

# Initialize FastAPI app
app = FastAPI(
    title="ITAM System API",
    description="IT Asset Management System with comprehensive features",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(users_router)
app.include_router(procurement_router)
app.include_router(analytics_router)
app.include_router(audit_router)
app.include_router(agent_router)

# Include scanner router if available
if SCANNER_AVAILABLE:
    scanner_router = create_scanner_router(get_database, get_current_user, UserResponse, asset_helper)
    app.include_router(scanner_router)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "ITAM System API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
