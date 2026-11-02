import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import init_db
from backend.app.api.endpoints.health import router as health_router
from backend.app.api.endpoints.readings import router as readings_router
from backend.app.api.endpoints.devices import router as devices_router
from backend.app.api.endpoints.settings import router as settings_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("beehive_monitor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created
    logger.info("Initializing Smart Beehive Monitor database tables...")
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database on startup: {e}")
    yield
    # Shutdown
    logger.info("Shutting down Smart Beehive Monitor backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="IoT backend API for Smart Beehive Monitor with ESP32 & DHT22 sensor",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local & remote IoT dashboard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)  # Provides GET /health
app.include_router(health_router, prefix=settings.API_V1_STR)  # Also provides GET /api/health
app.include_router(readings_router, prefix=settings.API_V1_STR)
app.include_router(devices_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
    }
