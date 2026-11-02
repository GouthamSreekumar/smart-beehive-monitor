import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/settings", tags=["Settings"])

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "thresholds_config.json")

class ThresholdsSchema(BaseModel):
    minTemp: float = Field(default=32.0, ge=-40.0, le=80.0, description="Minimum safe temperature in Celsius")
    maxTemp: float = Field(default=36.0, ge=-40.0, le=80.0, description="Maximum safe temperature in Celsius")
    minHumidity: float = Field(default=50.0, ge=0.0, le=100.0, description="Minimum safe humidity percentage")
    maxHumidity: float = Field(default=70.0, ge=0.0, le=100.0, description="Maximum safe humidity percentage")

def load_thresholds() -> ThresholdsSchema:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return ThresholdsSchema(**data)
        except Exception:
            pass
    return ThresholdsSchema()

def save_thresholds_file(thresholds: ThresholdsSchema) -> None:
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(thresholds.model_dump(), f, indent=2)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist threshold configuration: {str(e)}"
        )

@router.get("/thresholds", response_model=ThresholdsSchema)
def get_threshold_settings():
    """Get persisted safe operating thresholds."""
    return load_thresholds()

@router.put("/thresholds", response_model=ThresholdsSchema)
def update_threshold_settings(payload: ThresholdsSchema):
    """Persist new safe operating thresholds."""
    if payload.minTemp >= payload.maxTemp:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum temperature must be strictly less than maximum temperature"
        )
    if payload.minHumidity >= payload.maxHumidity:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum humidity must be strictly less than maximum humidity"
        )
    save_thresholds_file(payload)
    return payload

