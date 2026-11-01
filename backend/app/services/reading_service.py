from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from backend.app.models.reading import SensorReading, Device
from backend.app.schemas.reading import ReadingCreate, DeviceResponse
from backend.app.core.config import settings


class ReadingService:
    @staticmethod
    def create_reading(db: Session, reading_in: ReadingCreate) -> SensorReading:
        now_utc = datetime.now(timezone.utc)
        reading = SensorReading(
            device_id=reading_in.device_id,
            temperature_c=round(reading_in.temperature_c, 2),
            humidity_pct=round(reading_in.humidity_pct, 2),
            timestamp=now_utc,
        )
        db.add(reading)

        # Upsert device metadata
        device = db.query(Device).filter(Device.device_id == reading_in.device_id).first()
        if not device:
            device = Device(
                device_id=reading_in.device_id,
                name=f"Beehive Sensor ({reading_in.device_id})",
                last_seen=now_utc,
                last_temperature_c=round(reading_in.temperature_c, 2),
                last_humidity_pct=round(reading_in.humidity_pct, 2),
            )
            db.add(device)
        else:
            device.last_seen = now_utc
            device.last_temperature_c = round(reading_in.temperature_c, 2)
            device.last_humidity_pct = round(reading_in.humidity_pct, 2)

        db.commit()
        db.refresh(reading)
        return reading

    @staticmethod
    def get_latest_reading(db: Session, device_id: Optional[str] = None) -> Optional[SensorReading]:
        query = db.query(SensorReading)
        if device_id:
            query = query.filter(SensorReading.device_id == device_id)
        return query.order_by(desc(SensorReading.timestamp)).first()

    @staticmethod
    def get_readings(
        db: Session,
        device_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[SensorReading]:
        query = db.query(SensorReading)
        if device_id:
            query = query.filter(SensorReading.device_id == device_id)
        return query.order_by(desc(SensorReading.timestamp)).offset(skip).limit(limit).all()

    @staticmethod
    def get_history(
        db: Session,
        device_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        hours: Optional[float] = None,
        limit: int = 1000
    ) -> List[SensorReading]:
        query = db.query(SensorReading)
        now_utc = datetime.now(timezone.utc)

        if hours is not None and start_time is None:
            start_time = now_utc - timedelta(hours=hours)

        if device_id:
            query = query.filter(SensorReading.device_id == device_id)
        if start_time:
            query = query.filter(SensorReading.timestamp >= start_time)
        if end_time:
            query = query.filter(SensorReading.timestamp <= end_time)

        # Order chronologically for charts
        return query.order_by(SensorReading.timestamp.asc()).limit(limit).all()

    @staticmethod
    def get_devices(db: Session) -> List[DeviceResponse]:
        devices = db.query(Device).all()
        now_utc = datetime.now(timezone.utc)
        result: List[DeviceResponse] = []

        for d in devices:
            status = "offline"
            if d.last_seen:
                # Ensure last_seen has timezone info for comparison
                last_seen_aware = d.last_seen if d.last_seen.tzinfo else d.last_seen.replace(tzinfo=timezone.utc)
                diff = (now_utc - last_seen_aware).total_seconds()
                if diff <= settings.STALE_THRESHOLD_SECONDS:
                    status = "online"
                elif diff <= settings.OFFLINE_THRESHOLD_SECONDS:
                    status = "stale"
                else:
                    status = "offline"

            result.append(DeviceResponse(
                device_id=d.device_id,
                name=d.name or d.device_id,
                description=d.description,
                last_seen=d.last_seen,
                last_temperature_c=d.last_temperature_c,
                last_humidity_pct=d.last_humidity_pct,
                status=status
            ))
        return result

    @staticmethod
    def check_db_health(db: Session) -> bool:
        try:
            db.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

