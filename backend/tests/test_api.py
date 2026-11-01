from datetime import datetime, timezone, timedelta
import pytest
from backend.app.models.reading import SensorReading, Device


def test_health_endpoint(client):
    """Test /health endpoint returns 200 and healthy database status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert "timestamp" in data
    assert "version" in data


def test_empty_database_responses(client):
    """Test endpoints behavior when database has no readings."""
    # Latest reading should 404 when no readings exist
    latest_resp = client.get("/api/readings/latest")
    assert latest_resp.status_code == 404
    assert latest_resp.json()["detail"] == "No sensor readings found"

    # Readings list should return empty list
    readings_resp = client.get("/api/readings")
    assert readings_resp.status_code == 200
    assert readings_resp.json() == []

    # History should return empty list
    history_resp = client.get("/api/readings/history")
    assert history_resp.status_code == 200
    assert history_resp.json() == []

    # Devices should return empty list
    devices_resp = client.get("/api/devices")
    assert devices_resp.status_code == 200
    assert devices_resp.json() == []


def test_valid_sensor_reading_ingestion(client, db_session):
    """Test successful POST of a valid sensor reading."""
    payload = {
        "device_id": "beehive-001",
        "temperature_c": 34.65,
        "humidity_pct": 58.20
    }
    response = client.post("/api/readings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["device_id"] == "beehive-001"
    assert data["temperature_c"] == 34.65
    assert data["humidity_pct"] == 58.20
    assert "id" in data
    assert "timestamp" in data

    # Verify persistence directly in database session
    db_reading = db_session.query(SensorReading).filter(SensorReading.id == data["id"]).first()
    assert db_reading is not None
    assert db_reading.device_id == "beehive-001"
    assert db_reading.temperature_c == 34.65

    # Verify device record was created
    db_device = db_session.query(Device).filter(Device.device_id == "beehive-001").first()
    assert db_device is not None
    assert db_device.last_temperature_c == 34.65
    assert db_device.last_humidity_pct == 58.20


def test_invalid_temperature_bounds(client):
    """Test rejecting temperatures outside physical DHT22 range (-40 to 80 °C)."""
    # Below -40°C
    resp_low = client.post("/api/readings", json={
        "device_id": "beehive-001",
        "temperature_c": -45.0,
        "humidity_pct": 50.0
    })
    assert resp_low.status_code == 422

    # Above 80°C
    resp_high = client.post("/api/readings", json={
        "device_id": "beehive-001",
        "temperature_c": 85.5,
        "humidity_pct": 50.0
    })
    assert resp_high.status_code == 422


def test_invalid_humidity_bounds(client):
    """Test rejecting humidity outside 0 to 100%."""
    # Below 0%
    resp_low = client.post("/api/readings", json={
        "device_id": "beehive-001",
        "temperature_c": 30.0,
        "humidity_pct": -2.0
    })
    assert resp_low.status_code == 422

    # Above 100%
    resp_high = client.post("/api/readings", json={
        "device_id": "beehive-001",
        "temperature_c": 30.0,
        "humidity_pct": 105.0
    })
    assert resp_high.status_code == 422


def test_invalid_device_id(client):
    """Test rejecting empty or blank device_id."""
    resp_empty = client.post("/api/readings", json={
        "device_id": "   ",
        "temperature_c": 30.0,
        "humidity_pct": 50.0
    })
    assert resp_empty.status_code == 422


def test_latest_reading_retrieval(client):
    """Test retrieving latest reading overall and by device."""
    client.post("/api/readings", json={"device_id": "hive-A", "temperature_c": 33.0, "humidity_pct": 55.0})
    client.post("/api/readings", json={"device_id": "hive-B", "temperature_c": 35.0, "humidity_pct": 60.0})

    # Overall latest
    latest_resp = client.get("/api/readings/latest")
    assert latest_resp.status_code == 200
    assert latest_resp.json()["device_id"] == "hive-B"
    assert latest_resp.json()["temperature_c"] == 35.0

    # Specific device latest
    hive_a_resp = client.get("/api/readings/latest?device_id=hive-A")
    assert hive_a_resp.status_code == 200
    assert hive_a_resp.json()["device_id"] == "hive-A"
    assert hive_a_resp.json()["temperature_c"] == 33.0


def test_history_and_recent_readings(client):
    """Test reading history and recent readings pagination."""
    for i in range(5):
        client.post("/api/readings", json={
            "device_id": "hive-A",
            "temperature_c": 30.0 + i,
            "humidity_pct": 50.0 + i
        })

    # Recent readings (limit=3)
    recents = client.get("/api/readings?device_id=hive-A&limit=3").json()
    assert len(recents) == 3
    # Check descending order: newest has temperature 34.0
    assert recents[0]["temperature_c"] == 34.0

    # History readings
    history = client.get("/api/readings/history?device_id=hive-A&hours=1").json()
    assert len(history) == 5
    # History should be chronological: oldest first (30.0)
    assert history[0]["temperature_c"] == 30.0
    assert history[-1]["temperature_c"] == 34.0


def test_device_status_online_and_stale(client, db_session):
    """Test device status detection (online, stale, offline)."""
    now = datetime.now(timezone.utc)

    # 1. Device seen 10 seconds ago -> online
    dev_online = Device(
        device_id="hive-online",
        name="Online Hive",
        last_seen=now - timedelta(seconds=10),
        last_temperature_c=34.0,
        last_humidity_pct=60.0
    )
    # 2. Device seen 60 seconds ago -> stale
    dev_stale = Device(
        device_id="hive-stale",
        name="Stale Hive",
        last_seen=now - timedelta(seconds=60),
        last_temperature_c=33.0,
        last_humidity_pct=55.0
    )
    # 3. Device seen 200 seconds ago -> offline
    dev_offline = Device(
        device_id="hive-offline",
        name="Offline Hive",
        last_seen=now - timedelta(seconds=200),
        last_temperature_c=31.0,
        last_humidity_pct=50.0
    )

    db_session.add_all([dev_online, dev_stale, dev_offline])
    db_session.commit()

    resp = client.get("/api/devices")
    assert resp.status_code == 200
    devices = {d["device_id"]: d["status"] for d in resp.json()}

    assert devices["hive-online"] == "online"
    assert devices["hive-stale"] == "stale"
    assert devices["hive-offline"] == "offline"

