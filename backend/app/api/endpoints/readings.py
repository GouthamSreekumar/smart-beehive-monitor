from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.reading import ReadingCreate, ReadingResponse
from backend.app.services.reading_service import ReadingService

router = APIRouter(prefix="/readings", tags=["Readings"])


@router.post("", response_model=ReadingResponse, status_code=status.HTTP_201_CREATED)
def create_reading(reading_in: ReadingCreate, db: Session = Depends(get_db)):
    """Ingest a new sensor reading from ESP32."""
    try:
        reading = ReadingService.create_reading(db, reading_in)
        return reading
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist reading: {str(e)}"
        )


@router.get("/latest", response_model=ReadingResponse)
def get_latest_reading(
    device_id: Optional[str] = Query(None, description="Optional filter by device identifier"),
    db: Session = Depends(get_db)
):
    """Retrieve the most recent reading."""
    reading = ReadingService.get_latest_reading(db, device_id=device_id)
    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sensor readings found"
        )
    return reading


@router.get("/history", response_model=List[ReadingResponse])
def get_reading_history(
    device_id: Optional[str] = Query(None, description="Filter by device identifier"),
    hours: Optional[float] = Query(None, ge=0.1, le=720.0, description="Retrieve readings for the last N hours"),
    start_time: Optional[datetime] = Query(None, description="Start timestamp in ISO 8601 UTC format"),
    end_time: Optional[datetime] = Query(None, description="End timestamp in ISO 8601 UTC format"),
    limit: int = Query(1000, ge=1, le=5000, description="Maximum number of historical points"),
    db: Session = Depends(get_db)
):
    """Retrieve historical readings ordered chronologically for time-series charts."""
    return ReadingService.get_history(
        db,
        device_id=device_id,
        start_time=start_time,
        end_time=end_time,
        hours=hours,
        limit=limit
    )


@router.get("", response_model=List[ReadingResponse])
def get_readings(
    device_id: Optional[str] = Query(None, description="Filter by device identifier"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Retrieve recent readings ordered by latest first."""
    return ReadingService.get_readings(db, device_id=device_id, skip=skip, limit=limit)

