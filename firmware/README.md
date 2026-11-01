# Smart Beehive Monitor — ESP32 Firmware Guide

This directory contains the Arduino firmware for the ESP32 microcontroller reading from a DHT22 temperature and relative humidity sensor.

---

## 1. Hardware Pin Connections

| DHT22 Sensor Module Pin | ESP32 DevKit V1 Pin | Notes |
|:---|:---|:---|
| **`+` (VCC)** | **`3V3`** | Power supply (3.3V) |
| **`out` (DATA)** | **`D4` (GPIO 4)** | Sensor digital data line |
| **`−` (GND)** | **`GND`** | Common ground |

> [!IMPORTANT]
> The pin assignment `GPIO 4` and sensor type `DHT22` match the validated hardware test and must not be altered.

---

## 2. Software Requirements & Arduino IDE Setup

1. **Install Arduino IDE**: Download and install [Arduino IDE 2.x](https://www.arduino.cc/en/software).
2. **Add ESP32 Board Support**:
   - Open Arduino IDE $\rightarrow$ **File** $\rightarrow$ **Preferences**.
   - In **Additional boards manager URLs**, add:
     ```text
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Click **OK**.
   - Go to **Tools** $\rightarrow$ **Board** $\rightarrow$ **Boards Manager...**, search for `esp32` by *Espressif Systems*, and click **Install**.
3. **Install Required Libraries**:
   - Open **Sketch** $\rightarrow$ **Include Library** $\rightarrow$ **Manage Libraries...** (or press `Ctrl+Shift+I`).
   - Search for and install:
     - **DHT sensor library** by *Adafruit* (version 1.4.6 or later).
     - When prompted to install dependencies (such as **Adafruit Unified Sensor**), click **Install All**.

---

## 3. Configuration Before Flashing

Open `smart_beehive_monitor.ino` in Arduino IDE and update the configuration section at the top:

```cpp
// 1. Wi-Fi Credentials (2.4 GHz network only)
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Backend Server Endpoint (Replace with your computer's LAN IP)
const char* BACKEND_URL   = "http://192.168.1.100:8000/api/readings";

// 3. Unique Hive Identifier
const char* DEVICE_ID     = "beehive-001";
```

### How to Find Your Computer's LAN IP (Windows)
1. Open PowerShell on your computer and execute:
   ```powershell
   ipconfig
   ```
2. Look for your active network adapter (e.g., `Wireless LAN adapter Wi-Fi` or `Ethernet adapter`).
3. Locate the **IPv4 Address** line:
   ```text
   IPv4 Address. . . . . . . . . . . : 192.168.1.120
   ```
4. If your computer's IP is `192.168.1.120`, set `BACKEND_URL` to:
   ```cpp
   const char* BACKEND_URL = "http://192.168.1.120:8000/api/readings";
   ```

> [!CAUTION]
> Do **NOT** use `http://localhost:8000` or `http://127.0.0.1:8000`. The ESP32 is a separate network device; `localhost` would point back into the ESP32 itself!

---

## 4. Flashing the Firmware

1. Connect the ESP32 to your PC using the USB-C cable.
2. Select your board:
   - **Tools** $\rightarrow$ **Board** $\rightarrow$ **esp32** $\rightarrow$ **DOIT ESP32 DEVKIT V1** (or **ESP32 Dev Module**).
3. Select your serial COM port:
   - **Tools** $\rightarrow$ **Port** $\rightarrow$ (Select the COM port corresponding to Silicon Labs CP210x or CH340, e.g., `COM3` or `COM4`).
4. Click **Upload** (Arrow icon).
   - *Note*: If the upload displays `Connecting........_____.....`, press and hold the **BOOT** button on the ESP32 until the flashing percentage begins.
5. Open the **Serial Monitor** (**Tools** $\rightarrow$ **Serial Monitor** or `Ctrl+Shift+M`) and set the baud rate to **115200 baud**.

---

## 5. Serial Monitor Output Example

```text
==========================================
  Smart Beehive Monitor - ESP32 Firmware  
==========================================
Device ID:        beehive-001
DHT Sensor Pin:   GPIO4
DHT Sensor Type:  DHT22
Target Backend:   http://192.168.1.120:8000/api/readings
------------------------------------------
[DHT22] Sensor initialized on GPIO4.
[WiFi] Connecting to SSID: HomeNetwork_2.4G
......
[WiFi] Connected successfully!
[WiFi] ESP32 IP Address: 192.168.1.135
[WiFi] RSSI Signal: -56 dBm
------------------------------------------
[SENSOR] Temp: 34.6 °C | Humidity: 58.2 %
[HTTP] Sending POST to: http://192.168.1.120:8000/api/readings
[HTTP] Payload: {"device_id":"beehive-001","temperature_c":34.60,"humidity_pct":58.20}
[HTTP] Response code: 201
[HTTP] Response: {"device_id":"beehive-001","temperature_c":34.6,"humidity_pct":58.2,"id":1,"timestamp":"2026-10-29T15:00:00Z"}
```

