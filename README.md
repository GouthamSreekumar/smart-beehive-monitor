# Smart Beehive Monitor — Complete IoT System

A production-grade, end-to-end IoT monitoring solution engineered for precision honey bee (*Apis mellifera*) brood nest telemetry. Measures internal hive temperature and relative humidity with an **ESP32** and **DHT22** sensor, ingests readings via a high-performance **FastAPI** backend, persists data in **PostgreSQL 16**, and visualizes microclimate conditions in real time using a **Next.js** dashboard with **Apache ECharts**.

---

## Table of Contents
1. [Architecture & Data Flow](#1-architecture--data-flow)
2. [Hardware Wiring & Requirements](#2-hardware-wiring--requirements)
3. [Prerequisites](#3-prerequisites)
4. [Quick Start (Docker Deployment)](#4-quick-start-docker-deployment)
5. [Firmware Setup & Flashing](#5-firmware-setup--flashing)
6. [Windows Network & Firewall Setup](#6-windows-network--firewall-setup)
7. [Testing & Verification](#7-testing--verification)
8. [Database Access & Inspection](#8-database-access--inspection)
9. [Troubleshooting Guide](#9-troubleshooting-guide)
10. [Security & Reliability](#10-security--reliability)

---

## 1. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------+
|                                      HARDWARE TIER                                      |
|                                                                                         |
|   +-----------------------+           GPIO 4            +---------------------------+   |
|   |     DHT22 Sensor      | --------------------------> |    ESP32 DevKit V1        |   |
|   |  (Temp & Rel. Hum.)   |   (3.3V VCC / Common GND)   |  (Wi-Fi Client, HTTP POST)|   |
|   +-----------------------+                             +---------------------------+   |
+-----------------------------------------------------------------------|-----------------+
                                                                        |
                                                    Wi-Fi HTTP POST     |
                                              {"device_id": "...", ...} |
                                                                        v
+-----------------------------------------------------------------------------------------+
|                                CONTAINERIZED BACKEND TIER (Docker)                      |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                             FastAPI / Uvicorn (Port 8000)                       |   |
|   |  - Validates input bounds (-40 to 80 °C, 0 to 100 % RH)                         |   |
|   |  - Tracks device freshness (Online <30s, Stale 30-120s, Offline >120s)          |   |
|   |  - REST endpoints: /api/readings, /api/readings/latest, /api/devices, /health   |   |
|   +---------------------------------------------------------------------------------+   |
|                                         |                                               |
|                      SQLAlchemy 2.x ORM | Connection Pool                               |
|                                         v                                               |
|   +---------------------------------------------------------------------------------+   |
|   |                         PostgreSQL 16 (Service: db:5432)                        |   |
|   |  - Tables: sensor_readings, devices                                             |   |
|   |  - Persistent Docker Named Volume: db_data                                      |   |
|   |  - Optimized composite indexes: (device_id, timestamp DESC)                     |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------^-----------------+
                                                                        |
                                                  HTTP REST API / JSON  |
                                                  (Polling every 3-5s)  |
+-----------------------------------------------------------------------|-----------------+
|                                 WEB PRESENTATION TIER (Docker / Host)                   |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                       Next.js + TypeScript + Tailwind CSS (Port 3000)           |   |
|   |  - Real-time Brood Nest Metric Cards (Temp, Humidity, Last Sync, Status)       |   |
|   |  - Apache ECharts Time-Series Visualizer (15m, 1h, 6h, 24h ranges)              |   |
|   |  - Configurable Anomaly Alert Banners (Default: 32–36 °C, 50–70 % RH)           |   |
|   |  - Demo Ingest Simulator for hardware-free functional verification              |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Hardware Wiring & Requirements

### Bill of Materials
- **Microcontroller**: ESP32 DevKit V1 (30-pin, ESP32-WROOM-32, USB-C).
- **Sensor**: DHT22 / AM2302 (3-pin module labelled `+`, `out`, `−`).
- **Wiring & Power**: Solderless breadboard, jumper wires, USB-C data cable.

### Confirmed Wiring Table

| DHT22 Sensor Module Pin | ESP32 DevKit V1 Pin | Function |
|:---|:---|:---|
| **`+` (VCC)** | **`3V3`** | 3.3V Power Supply |
| **`out` (DATA)** | **`D4` (GPIO 4)** | Single-bus bidirectional data line |
| **`−` (GND)** | **`GND`** | Common ground reference |

> [!IMPORTANT]
> The hardware pin assignment `GPIO 4` and sensor type `DHT22` match the validated test bench. Do not reassign pins.

---

## 3. Prerequisites

Ensure the following tools are installed on your Windows development computer:

1. **Docker Desktop**: [Download for Windows](https://www.docker.com/products/docker-desktop/).
   - Ensure WSL 2 backend is enabled and Docker Desktop is running.
2. **Arduino IDE 2.x**: [Download from Arduino](https://www.arduino.cc/en/software).
3. **USB-UART Drivers**:
   - If your ESP32 uses the CP2102 or CH340 chip, install the appropriate Windows driver if the COM port does not appear in Device Manager.

---

## 4. Quick Start (Docker Deployment)

### Step 1: Clone or Navigate to the Workspace
Open Windows PowerShell:
```powershell
cd d:\beemonitor
```

### Step 2: Initialize Environment Variables
Copy the example environment configuration:
```powershell
Copy-Item .env.example .env
```
*(Default credentials inside `.env` work immediately for local testing).*

### Step 3: Build and Start Containers
Run Docker Compose in PowerShell:
```powershell
docker compose up --build -d
```

### Step 4: Verify Container Health
```powershell
docker compose ps
```
You should observe three healthy services:
- `beemonitor_db` (PostgreSQL 16)
- `beemonitor_backend` (FastAPI at `http://localhost:8000`)
- `beemonitor_frontend` (Next.js at `http://localhost:3000`)

### Step 5: Access the Web Interfaces
- **Web Dashboard**: Open [http://localhost:3000](http://localhost:3000)
- **Interactive API Documentation**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Endpoint**: Open [http://localhost:8000/health](http://localhost:8000/health)

---

## 5. Firmware Setup & Flashing

### Step 1: Install ESP32 Board Package in Arduino IDE
1. Open Arduino IDE $\rightarrow$ **File** $\rightarrow$ **Preferences**.
2. In **Additional boards manager URLs**, add:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools** $\rightarrow$ **Board** $\rightarrow$ **Boards Manager...**, search for `esp32` by *Espressif Systems*, and click **Install**.

### Step 2: Install Sensor Libraries
1. Open **Sketch** $\rightarrow$ **Include Library** $\rightarrow$ **Manage Libraries...**.
2. Search for **DHT sensor library** by *Adafruit* (v1.4.6 or later) and click **Install**.
3. When prompted to install missing dependencies (like **Adafruit Unified Sensor**), click **Install All**.

### Step 3: Configure the Sketch
Open `firmware/smart_beehive_monitor.ino` and update the top configuration section:

```cpp
// 1. Wi-Fi Credentials (Must be a 2.4 GHz network)
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Backend Server Endpoint (Replace with your computer's LAN IP!)
const char* BACKEND_URL   = "http://192.168.1.120:8000/api/readings";

// 3. Unique Hive Identifier
const char* DEVICE_ID     = "beehive-001";
```

### Step 4: Flash the Microcontroller
1. Connect the ESP32 to your PC via USB-C.
2. Under **Tools** $\rightarrow$ **Board**, choose **DOIT ESP32 DEVKIT V1** (or **ESP32 Dev Module**).
3. Under **Tools** $\rightarrow$ **Port**, select the active COM port (e.g. `COM3`).
4. Click **Upload**. *(If the IDE displays `Connecting........`, hold down the `BOOT` button on the board until uploading starts).*
5. Open **Serial Monitor** at **115200 baud** to view real-time transmission diagnostics.

---

## 6. Windows Network & Firewall Setup

Because the ESP32 is an independent device on your local Wi-Fi, it must reach your computer's local network IP.

### Discover Your LAN IP
Run this command in Windows PowerShell:
```powershell
ipconfig
```
Locate the IPv4 Address under your active Wi-Fi or Ethernet adapter:
```text
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.120
```
Use this IP in `firmware/smart_beehive_monitor.ino` for `BACKEND_URL`:
```cpp
const char* BACKEND_URL = "http://192.168.1.120:8000/api/readings";
```

> [!CAUTION]
> Never use `localhost` or `127.0.0.1` in the Arduino code. To the ESP32, `localhost` means the microcontroller itself, causing connections to fail immediately.

### Allow Inbound Connections Through Windows Firewall
Windows Defender Firewall often blocks incoming connections on port 8000 from local network devices. Run this one-time command in an **Administrator PowerShell** window:

```powershell
New-NetFirewallRule -DisplayName "FastAPI Smart Beehive Monitor" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

---

## 7. Testing & Verification

### Automated Backend Tests
Automated tests run in an isolated in-memory test database:

```powershell
# Run from workspace root using the virtual environment:
.\.venv\Scripts\pytest.exe -v
```

All 9 test cases will run and pass:
- `test_health_endpoint`
- `test_empty_database_responses`
- `test_valid_sensor_reading_ingestion`
- `test_invalid_temperature_bounds`
- `test_invalid_humidity_bounds`
- `test_invalid_device_id`
- `test_latest_reading_retrieval`
- `test_history_and_recent_readings`
- `test_device_status_online_and_stale`

### Manual API Test (PowerShell)
You can inject a reading directly into the backend from Windows PowerShell:

```powershell
$body = @{
    device_id = "beehive-001"
    temperature_c = 34.6
    humidity_pct = 58.2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/readings" -Method Post -Body $body -ContentType "application/json"
```

Expected Response:
```json
{
  "device_id": "beehive-001",
  "temperature_c": 34.6,
  "humidity_pct": 58.2,
  "id": 1,
  "timestamp": "2026-10-29T15:10:00.123456Z"
}
```

### Dashboard Live Testing
1. Navigate to `http://localhost:3000`.
2. Notice the live status pills, summary cards, and ECharts visualizations.
3. Click the **Demo Ingest** button in the header to simulate live telemetry if the physical ESP32 is not plugged in.
4. Click **Thresholds** to adjust the minimum and maximum alert bands.

---

## 8. Database Access & Inspection

The PostgreSQL database persists all readings in a Docker volume named `beemonitor_db_data`.

### Query Readings via `docker exec` (Inside Container)
Run `psql` directly inside the container from Windows PowerShell:

```powershell
docker exec -it beemonitor_db psql -U postgres -d beemonitor -c "SELECT id, device_id, temperature_c, humidity_pct, timestamp FROM sensor_readings ORDER BY timestamp DESC LIMIT 10;"
```

### Inspect Registered Devices
```powershell
docker exec -it beemonitor_db psql -U postgres -d beemonitor -c "SELECT * FROM devices;"
```

### Running Alembic Migrations
Migrations are applied automatically on startup, but you can also execute them manually inside the backend container:
```powershell
docker exec -it beemonitor_backend alembic upgrade head
```

---

## 9. Troubleshooting Guide

| Problem | Root Cause | Solution |
|:---|:---|:---|
| **ESP32 COM port does not appear in Arduino IDE** | Missing USB-to-UART bridge driver or charge-only USB cable. | 1. Ensure cable supports data, not charging only.<br>2. Install Silicon Labs CP210x or CH340 driver.<br>3. Check Windows Device Manager under *Ports (COM & LPT)*. |
| **`Connecting........_____.....` during flash upload** | ESP32 bootloader waiting for flash mode signal. | Hold down the **BOOT** (or IO0) button on the ESP32 until the upload percentage starts counting. |
| **DHT22 read failure (`NaN`)** | Incorrect wiring, floating data pin, or rapid polling. | 1. Verify `+` is on `3V3`, `out` on `GPIO 4`, and `−` on `GND`.<br>2. Ensure sensor sampling interval is $\ge 5$ seconds.<br>3. If using a bare 4-pin DHT22 without PCB module, add a 10k pull-up resistor between VCC and DATA. |
| **ESP32 Wi-Fi fails to connect** | 5 GHz network selected or weak signal. | ESP32 only supports 2.4 GHz Wi-Fi bands. Connect to a 2.4 GHz SSID. |
| **HTTP error code `-1` / Connection refused** | Wrong IP address, Docker backend stopped, or Windows Firewall. | 1. Double check LAN IP with `ipconfig`. Do not use `localhost`.<br>2. Run the `New-NetFirewallRule` command in Section 6.<br>3. Confirm backend is running with `docker compose ps`. |
| **Docker containers restarting or failing to start** | Docker Desktop daemon not running or port 8000/3000 conflict. | 1. Ensure Docker Desktop is started and shows green whale icon.<br>2. Check for port conflicts using `netstat -ano \| findstr 8000`. |
| **Dashboard displays "No readings found"** | Fresh database with no recorded telemetry. | Ingest the first reading via the ESP32, run the sample PowerShell request, or click **Demo Ingest** on the dashboard. |

---

## 10. Security & Reliability

1. **Local Prototype vs. Production Transport**: Plain HTTP is used here for zero-friction local IoT prototyping. In a remote or field deployment, terminate HTTPS using a reverse proxy (e.g. Caddy, Traefik, or Nginx) with Let's Encrypt TLS certificates.
2. **Credential Isolation**: Database passwords and credentials are never hardcoded in source files. They are injected via environment variables (`.env`) and `.gitignore` prevents inadvertent commits.
3. **Database Injection Protection**: All SQL operations use SQLAlchemy ORM parameterization, mitigating SQL injection risks.
4. **Resilient Microcontroller Loop**: The ESP32 firmware relies on non-blocking `millis()` timing and automatic reconnect loops to prevent freeze-ups during network hiccups.

