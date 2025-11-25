
"""
Main FastAPI Application
Central entry point for all backend services.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import configuration
from .config import CORS_ORIGINS

# Import application modules
from .multifinger_caliper.routes import router as multifinger_caliper_router
# from .universal_converter.routes import router as universal_converter_router  # Uncomment when ready to use

# Initialize FastAPI application
app = FastAPI(
    title="Studio Backend API",
    description="Backend API for Studio applications",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include application routers
app.include_router(multifinger_caliper_router)
# app.include_router(universal_converter_router)  # Uncomment when ready to use


@app.get("/")
def read_root():
    """Root endpoint for health check."""
    return {"Hello": "World", "status": "Backend is running"}
