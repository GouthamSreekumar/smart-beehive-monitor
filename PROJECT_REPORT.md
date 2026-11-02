# SMART BEEHIVE MONITORING AND NOTIFICATION SYSTEM

---

## 1. INTRODUCTION

Honey bees (*Apis mellifera*) play a crucial role in agriculture and terrestrial ecosystems as primary pollinators of crops and wild flora. Maintaining optimal colony health requires close attention to the microclimate of the brood nest, where honey bees actively thermoregulate temperatures between 32.0°C and 36.0°C and maintain relative humidity between 50% and 70%. Unexpected fluctuations—such as brood chilling, excessive heat stress, or excessive moisture leading to fungal infections (chalkbrood)—can decimate colonies.

Traditional beekeeping methods rely on manual, physical hive inspections. However, frequent manual hive opening disrupts the colony's carefully controlled microclimate, induces stress, damages comb structure, and risks injuring the queen. Furthermore, periodic physical visits cannot detect acute environmental shocks or sudden temperature drops in real time.

To address this challenge, this project proposes an **IoT-based Smart Beehive Monitoring and Notification System** that continuously measures intra-hive temperature and relative humidity and provides instant alerts when conditions breach biological safety limits. The system integrates a digital DHT22 sensor with an ESP32 microcontroller, transmitting encrypted telemetry to a containerized cloud backend powered by FastAPI, PostgreSQL 16, and a Next.js dashboard deployed with custom domain support.

This solution offers a non-invasive, reliable, low-cost, and scalable approach to modern precision apiculture while eliminating manual inspection overhead.

---

## 2. AIM OF THE PROJECT

The main aim of this project is to design, develop, and deploy an IoT-enabled beehive microclimate monitoring system that continuously measures internal temperature and relative humidity, persists timestamped telemetry in a time-series database, triggers automatic anomaly alerts, and enables beekeepers to track hive health remotely via a real-time web dashboard.

---

## 3. OBJECTIVES

- To measure internal beehive temperature (°C) and relative humidity (% RH) in real time using a precision digital DHT22 sensor.
- To process, filter, and transmit sensor readings through an ESP32 microcontroller to the cloud using non-blocking HTTP/HTTPS REST communication.
- To store and index timestamped microclimate readings in a PostgreSQL 16 database.
- To develop an interactive, responsive web dashboard with live metric indicators and Apache ECharts time-series graphs (15 min, 1 hour, 6 hours, 24 hours).
- To send automatic visual alerts and freshness warnings when microclimate metrics exceed critical limits or telemetry stops.
- To deliver a fully containerized (Docker) cloud deployment accessible globally via custom domain routing (`beehivemonitor.gouthamsreekumar.dev`).

---

## 4. EXISTING SYSTEM

Existing methods of apiary management rely on periodic on-site physical inspections by beekeepers, occasionally augmented with basic mechanical analog dial thermometers placed outside or under the outer cover.

### Disadvantages:
- **Intrusive to Colony Life**: Opening the hive breaks propolis seals and causes sudden heat and humidity loss that bees spend hours restoring.
- **Time-Consuming and Labor-Intensive**: Manual checks across dispersed apiaries require substantial travel and effort.
- **No Continuous Telemetry**: Inspections capture only an instantaneous snapshot, missing overnight freezes or sudden overheating.
- **Delayed Intervention**: Colony collapse, queen failure, or disease outbreaks often progress irreversibly before the next scheduled visit.
- **Inefficient Trend Analysis**: Paper or manual logbooks lack automated aggregation, charting, or predictive analytics.

---

## 5. PROPOSED SYSTEM

The proposed system introduces an end-to-end, IoT-based smart beehive monitoring device capable of continuously capturing brood nest temperature and relative humidity, transmitting readings at user-configured intervals (e.g., 2–5 seconds) to a high-availability cloud server.

The ESP32 microcontroller acquires readings via the single-bus DHT22 interface, applies bounds validation, and posts structured JSON payloads over Wi-Fi. The cloud backend evaluates data against configurable biological thresholds (default: 32.0°C–36.0°C, 50%–70% RH), categorizing hive state into **Normal**, **Warning**, or **Critical**, and detecting communication staleness (>30s) or offline status (>120s). Beekeepers monitor real-time trends and historical patterns from any browser globally.

This architecture eliminates unnecessary hive openings, facilitates timely interventions, and provides scientific telemetry for precision beekeeping.

---

## 6. SYSTEM ARCHITECTURE

The architecture comprises three integrated layers: **Device Layer**, **Cloud & Persistence Layer**, and **User Presentation Layer**.

```
+---------------------------------------------------------------------------------+
|                                 1. DEVICE LAYER                                 |
|                                                                                 |
|   +-----------------------+           GPIO 4            +-------------------+   |
|   |     DHT22 Sensor      | --------------------------> |  ESP32 DevKit V1  |   |
|   |  (Temp & Rel. Hum.)   |   (3.3V VCC / Common GND)   |  (Wi-Fi / HTTPS)  |   |
|   +-----------------------+                             +-------------------+   |
+-------------------------------------------------------------------|-------------+
                                                                    |
                                                HTTPS POST JSON     |
                                          {"device_id": "...", ...} |
                                                                    v
+---------------------------------------------------------------------------------+
|                         2. CLOUD & PERSISTENCE LAYER                            |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   |                 FastAPI Backend Service (Python 3.11 / Uvicorn)         |   |
|   |   - Pydantic Schema Validation & Bound Checking                         |   |
|   |   - Device Health & Freshness Tracking (Online / Stale / Offline)       |   |
|   |   - REST API Endpoints: /api/readings, /api/readings/history, /health   |   |
|   +-------------------------------------------------------------------------+   |
|                                        |                                        |
|                     SQLAlchemy 2.0 ORM | Pooled Connection                      |
|                                        v                                        |
|   +-------------------------------------------------------------------------+   |
|   |                   Managed PostgreSQL 16 Database                        |   |
|   |   - Tables: sensor_readings, devices                                    |   |
|   |   - Composite Indexes: (device_id, timestamp DESC)                      |   |
|   |   - Persistent Storage & Alembic Migrations                             |   |
|   +-------------------------------------------------------------------------+   |
+-------------------------------------------------------------------^-------------+
                                                                    |
                                                HTTPS REST (Polling)|
                                                                    |
+-------------------------------------------------------------------|-------------+
|                         3. USER PRESENTATION LAYER                              |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   |           Next.js 14 Dashboard (TypeScript + Tailwind CSS)              |   |
|   |   - Real-time Brood Nest Telemetry Cards (Temp, Humidity, Status)       |   |
|   |   - Apache ECharts Interactive Graphs (15m, 1h, 6h, 24h)                 |   |
|   |   - Dynamic Alert Banners & Modal Threshold Tuning                      |   |
|   |   - Deployed at https://beehivemonitor.gouthamsreekumar.dev             |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
```

### 6.1 Hardware Components
- **ESP32 DevKit V1 (30-pin, ESP-WROOM-32)**: 32-bit dual-core microcontroller with 2.4 GHz Wi-Fi and Bluetooth.
- **DHT22 (AM2302) Sensor Module**: High-precision capacitive humidity and thermistor sensor (Temp: -40°C to +80°C $\pm$0.5°C; Humidity: 0–100% $\pm$2% RH).
- **Solderless Breadboard & Project Box**: Mounts the circuit securely outside or inside the top cover.
- **Jumper Wires**: Connects power, data, and ground between modules.
- **USB-C / 5V Power Supply**: Powers the ESP32 board continuously.

### 6.2 Software Components
- **Arduino IDE & C++ Core**: Firmware development, sensor timing via `millis()`, and Wi-Fi reconnection handling.
- **FastAPI (Python 3.11)**: High-performance asynchronous REST API framework for sensor ingestion and data querying.
- **SQLAlchemy 2.x & Alembic**: Database ORM and automated schema migration management.
- **PostgreSQL 16**: Relational database with composite indexing for high-frequency time-series telemetry.
- **Next.js 14 (React & TypeScript)**: Modern frontend framework utilizing standalone build configuration and Tailwind CSS.
- **Apache ECharts**: High-performance canvas charting library for smooth multi-range microclimate visualization.
- **Docker & Render Cloud**: Containerized deployment orchestrating microservices with automated TLS certificates.

---

## 7. WORKING PRINCIPLE

1. **Initialization**: On boot, the ESP32 initializes the DHT22 on GPIO 4, starts serial diagnostics at 115200 baud, and establishes a WPA2 connection to the designated Wi-Fi network.
2. **Data Acquisition**: Using non-blocking `millis()` timing, the ESP32 reads temperature and relative humidity every 2 to 5 seconds, respecting the capacitive sensor's thermal stabilization period.
3. **Validation**: The microcontroller performs NaN checks and verifies readings against physical operating limits (-40°C to 80°C; 0% to 100% RH).
4. **Data Transmission**: Validated readings are packed into a JSON payload (`device_id`, `temperature_c`, `humidity_pct`) and transmitted over HTTP/HTTPS POST to the backend endpoint (`/api/readings`).
5. **Ingestion & Persistence**: FastAPI validates inputs against Pydantic models and records them with UTC timestamps into PostgreSQL 16. It updates the device record with the latest timestamp.
6. **Freshness & Threshold Evaluation**:
   - $\le 30$ seconds since last reading: **Online**
   - $30$ to $120$ seconds: **Stale Telemetry** (warning)
   - $> 120$ seconds: **Offline** (critical)
7. **Real-time Visualization**: The Next.js dashboard polls the cloud backend every 3 seconds, rendering interactive ECharts curves and displaying brood condition badges.

---

## 8. CONNECTION DETAILS

| Sensor / Module Pin | Function | ESP32 DevKit V1 Pin | Operating Voltage |
|:---|:---|:---|:---|
| **DHT22 `+` (VCC)** | Power Supply | **`3V3`** | 3.3 V DC |
| **DHT22 `out` (DATA)** | Single-Bus Data | **`D4` (GPIO 4)** | 3.3 V Logic |
| **DHT22 `−` (GND)** | Ground Reference | **`GND`** | 0 V Reference |
| **ESP32 USB-C** | Main Power Input | **VBUS / 5V** | 5.0 V DC (from Adapter) |

---

## 9. CLOUD & CONTAINER HOSTING

The application is deployed to production using a containerized microservice architecture on **Render**:

```
Render Cloud Platform
├── Managed PostgreSQL 16 Database ("beehive-db")
│   └── Persistent storage with automated connection string injection
├── Backend Web Service ("beehive-backend")
│   ├── Built via ./backend/Dockerfile (Python 3.11-slim)
│   ├── Internal connection to beehive-db
│   └── Public Endpoint: https://beehive-backend-zau6.onrender.com
└── Frontend Web Service ("beehive-frontend")
    ├── Built via ./frontend/Dockerfile (Node 20-alpine standalone)
    ├── Bound to HOSTNAME="0.0.0.0" on Port 3000
    ├── Custom Domain: https://beehivemonitor.gouthamsreekumar.dev
    └── Automated SSL/TLS management via Let's Encrypt
```

- **Local Docker Compose**: Developers can also execute `docker compose up --build -d` locally to run PostgreSQL, FastAPI, and Next.js in synchronized local containers.

---

## 10. RESULTS

The implemented system successfully:
- Measures real-time intra-hive temperature and relative humidity at configurable intervals (2s–5s).
- Streams microclimate readings over Wi-Fi directly to the cloud backend.
- Persists all historical measurements in PostgreSQL with sub-second retrieval speeds.
- Visualizes real-time microclimate curves on an interactive web dashboard.
- Highlights brood-nest health status (**Optimal Brood**, **Chilled Brood Alert**, **Overheating Alert**, **Condensation Warning**).
- Enables global remote monitoring through a secure custom domain: **`https://beehivemonitor.gouthamsreekumar.dev`**.

---

## 11. ADVANTAGES

- **Non-Invasive Monitoring**: Eliminates unnecessary manual hive openings, preserving propolis seals and brood heat.
- **Real-Time Anomaly Detection**: Immediate warnings prevent brood mortality caused by seasonal temperature drops or summer heatwaves.
- **Scientific Brood Management**: Correlates humidity levels with honey ripening and fungal disease prevention (e.g., chalkbrood).
- **Scalable Architecture**: The database and API natively accommodate multiple monitored hives (`hive-001`, `hive-002`, etc.).
- **Global Accessibility**: Cloud deployment and HTTPS custom domain enable access from smartphones, tablets, or computers anywhere.
- **Cost-Effective & Open Hardware**: Built with commodity components (ESP32, DHT22) offering industrial-grade telemetry at low cost.

---

## 12. APPLICATIONS

- **Commercial Apiaries**: Centralized telemetry across dispersed hive yards to prioritize field inspections.
- **Hobbyist & Urban Beekeepers**: Remote monitoring of backyard or rooftop hives without disrupting urban colonies.
- **Agricultural Pollination Services**: Verification of colony strength and active thermoregulation during seasonal crop pollination contracts.
- **Apiculture Research & Universities**: Continuous longitudinal microclimate data logging for studying climate change impacts on pollinator vitality.

---

## 13. FUTURE ENHANCEMENTS

- **Hive Scale Integration (Load Cell & HX711)**: Tracking daily nectar flow, honey yield, and swarming events through weight loss.
- **Acoustic Audio Frequency Monitoring**: Installing an I2S digital microphone to detect piping queens, swarming sounds, and Africanized aggression.
- **Cellular & LoRaWAN Connectivity**: Adding LoRa or NB-IoT transceivers for remote wilderness apiaries outside Wi-Fi coverage.
- **SMS / WhatsApp / Email Push Alerts**: Integrating Twilio or SendGrid webhooks for urgent anomaly notifications.
- **Solar Power Harvesting**: Pairing a 5V solar panel with a LiFePO4 battery and deep-sleep firmware for complete autonomous off-grid operation.

---

## 14. CONCLUSION

The **Smart Beehive Monitoring and Notification System** delivers an automated, intelligent, and non-invasive solution for monitoring honey bee colony microclimates. By combining the ESP32 microcontroller and DHT22 sensor with a scalable FastAPI, PostgreSQL, and Next.js cloud stack, the system bridges traditional apiculture with modern IoT technologies. It prevents colony losses, saves beekeepers substantial manual inspection hours, and lays a robust technical foundation for smart, sustainable agriculture.

---

## 15. PROJECT DESIGN & DATA FLOW

```
[DHT22 Sensor (Temp & Humidity)]
            |  (GPIO 4 Data Line)
            v
[ESP32 DevKit V1 Microcontroller]
            |  (Wi-Fi / HTTPS POST /api/readings)
            v
[FastAPI Cloud Backend Service] <=========> [PostgreSQL 16 Database]
            ^
            |  (REST Polling every 3s)
            v
[Next.js Web Dashboard (Apache ECharts)]
            |
            v
[Beekeeper Global Access via https://beehivemonitor.gouthamsreekumar.dev]
```

---

## 16. HARDWARE SPECIFICATIONS SUMMARY

- **Microcontroller**: ESP32 DOIT DevKit V1 (ESP-WROOM-32, Dual-core Tensilica Xtensa 32-bit LX6 @ 240 MHz).
- **Wi-Fi Protocol**: 802.11 b/g/n (2.4 GHz) with WPA/WPA2/WPA3 support.
- **Sensor**: DHT22 / AM2302 Digital Relative Humidity and Temperature Sensor.
- **Temperature Range & Accuracy**: -40.0°C to +80.0°C ($\pm$0.5°C).
- **Humidity Range & Accuracy**: 0.0% to 100.0% RH ($\pm$2.0% RH).
- **Sampling Rate**: Configured for 2.0 s (physical limit $\ge 2$ s).
- **Operating Voltage**: 3.3 V DC (powered directly from the ESP32 3V3 rail).

---

## 17. PRODUCTION DEPLOYMENT & METRICS

- **Custom Production URL**: [https://beehivemonitor.gouthamsreekumar.dev](https://beehivemonitor.gouthamsreekumar.dev)
- **Live API Documentation (Swagger)**: [https://beehive-backend-zau6.onrender.com/docs](https://beehive-backend-zau6.onrender.com/docs)
- **Health Check Endpoint**: [https://beehive-backend-zau6.onrender.com/health](https://beehive-backend-zau6.onrender.com/health)
- **Telemetry Ingestion Endpoint**: `POST /api/readings`
- **Target Microclimate Limits**:
  - Target Temperature: 32.0°C – 36.0°C
  - Target Relative Humidity: 50.0% – 70.0%

