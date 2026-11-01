from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, Index
from sqlalchemy.sql import func
from backend.app.db.base import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), nullable=False, index=True)
    temperature_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    __table_args__ = (
        Index("idx_device_timestamp", "device_id", "timestamp"),
    )


class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    description = Column(String(255), nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    last_temperature_c = Column(Float, nullable=True)
    last_humidity_pct = Column(Float, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

