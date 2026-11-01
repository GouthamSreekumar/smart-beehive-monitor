from backend.app.api.endpoints.health import router as health_router
from backend.app.api.endpoints.readings import router as readings_router
from backend.app.api.endpoints.devices import router as devices_router

__all__ = ["health_router", "readings_router", "devices_router"]

