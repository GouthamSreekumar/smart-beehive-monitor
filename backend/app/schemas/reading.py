from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ReadingBase(BaseModel):
    device_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Unique device identifier (e.g. beehive-001)"
    )
    temperature_c: float = Field(
        ...,
        ge=-40.0,
        le=80.0,
        description="Temperature in Celsius (-40.0 to 80.0 °C for DHT22)"
    )
    humidity_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Relative humidity percentage (0.0 to 100.0 %)"
    )

    @field_validator("device_id")
    @classmethod
    def validate_device_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("device_id cannot be blank or whitespace")
        return v


class ReadingCreate(ReadingBase):
    pass


class ReadingResponse(ReadingBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class DeviceResponse(BaseModel):
    device_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    last_seen: Optional[datetime] = None
    last_temperature_c: Optional[float] = None
    last_humidity_pct: Optional[float] = None
    status: str = Field(
        ...,
        description="'online' (< 30s), 'stale' (30s - 120s), or 'offline' (> 120s)"
    )

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime
    version: str

