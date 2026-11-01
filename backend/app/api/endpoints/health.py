from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.reading import HealthResponse
from backend.app.services.reading_service import ReadingService
from backend.app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health(response: Response, db: Session = Depends(get_db)):
    """Health check for backend API and PostgreSQL database."""
    is_db_healthy = ReadingService.check_db_health(db)
    now_utc = datetime.now(timezone.utc)

    if not is_db_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="degraded",
            database="disconnected",
            timestamp=now_utc,
            version=settings.VERSION,
        )

    return HealthResponse(
        status="ok",
        database="connected",
        timestamp=now_utc,
        version=settings.VERSION,
    )

