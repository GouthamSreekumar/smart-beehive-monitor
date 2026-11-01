from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.reading import DeviceResponse
from backend.app.services.reading_service import ReadingService

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceResponse])
def get_devices(db: Session = Depends(get_db)):
    """List all registered or observed devices with calculated freshness status."""
    return ReadingService.get_devices(db)

