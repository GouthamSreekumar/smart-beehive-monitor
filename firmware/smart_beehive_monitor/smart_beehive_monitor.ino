/*
 * Smart Beehive Monitor - ESP32 & DHT22 Firmware
 * 
 * Hardware:
 *   - ESP32 DevKit V1 (ESP-WROOM-32, 30-pin)
 *   - DHT22 (AM2302) Temperature & Relative Humidity Sensor
 * 
 * Confirmed Wiring:
 *   - DHT22 '+' (VCC)  --> ESP32 3V3
 *   - DHT22 'out' (DATA) --> ESP32 D4 (GPIO4)
 *   - DHT22 '-' (GND)  --> ESP32 GND
 * 
 * Libraries Required (install via Arduino Library Manager):
 *   - "DHT sensor library" by Adafruit (v1.4.6 or later)
 *   - "Adafruit Unified Sensor" by Adafruit
 *   - Built-in ESP32 "WiFi.h" and "HTTPClient.h"
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ==========================================
// CONFIGURATION - UPDATE THESE VALUES
// ==========================================

// 1. Wi-Fi Credentials
// Replace with your 2.4 GHz Wi-Fi SSID and Password
const char* WIFI_SSID     = "Galaxy A21s1BAF";
const char* WIFI_PASSWORD = "12345678";

// 2. Backend Server Endpoint
// Replace YOUR_COMPUTER_LAN_IP with your PC's LAN IP (run 'ipconfig' in Windows PowerShell)
// Note: Do NOT use 'localhost' or '127.0.0.1' because that refers to the ESP32 itself.
const char* BACKEND_URL = "http://10.72.209.134:8000/api/readings";

// 3. Device Identification
const char* DEVICE_ID     = "beehive-001";

// 4. Transmission Interval (DHT22 requires >= 2 seconds, 5000 ms to 10000 ms recommended)
const unsigned long TRANSMISSION_INTERVAL_MS = 5000;

// 5. Hardware Pin & Sensor Configuration (Preserve GPIO4 and DHT22)
#define DHTPIN 4
#define DHTTYPE DHT22

// Initialize DHT sensor
DHT dht(DHTPIN, DHTTYPE);

// Non-blocking timer tracking
unsigned long lastTransmissionTime = 0;
unsigned long lastWifiCheckTime = 0;
const unsigned long WIFI_CHECK_INTERVAL_MS = 10000;

// LED Indicator (ESP32 DevKit built-in LED is usually GPIO 2)
#define LED_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(115200);
  delay(1000); // Give serial monitor time to connect

  Serial.println("\n==========================================");
  Serial.println("  Smart Beehive Monitor - ESP32 Firmware  ");
  Serial.println("==========================================");
  Serial.print("Device ID:        "); Serial.println(DEVICE_ID);
  Serial.print("DHT Sensor Pin:   GPIO"); Serial.println(DHTPIN);
  Serial.print("DHT Sensor Type:  DHT22");
  Serial.println();
  Serial.print("Target Backend:   "); Serial.println(BACKEND_URL);
  Serial.println("------------------------------------------");

  // Initialize DHT sensor
  dht.begin();
  Serial.println("[DHT22] Sensor initialized on GPIO4.");

  // Connect to Wi-Fi
  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  // Periodic Wi-Fi reconnection check without blocking execution
  if (currentMillis - lastWifiCheckTime >= WIFI_CHECK_INTERVAL_MS) {
    lastWifiCheckTime = currentMillis;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Connection lost. Attempting non-blocking reconnect...");
      WiFi.reconnect();
    }
  }

  // Periodic sensor read and HTTP POST transmission
  if (currentMillis - lastTransmissionTime >= TRANSMISSION_INTERVAL_MS) {
    lastTransmissionTime = currentMillis;

    // Read humidity and temperature
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); // Celsius

    // Validate sensor readings
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("[ERROR] Failed to read from DHT22 sensor! Check wiring.");
      return;
    }

    // Physical sanity check for DHT22 bounds
    if (temperature < -40.0 || temperature > 80.0 || humidity < 0.0 || humidity > 100.0) {
      Serial.print("[WARN] Reading out of physical bounds: ");
      Serial.print("Temp="); Serial.print(temperature);
      Serial.print("C, Humidity="); Serial.print(humidity);
      Serial.println("% - Skipping transmission.");
      return;
    }

    // Print reading diagnostics to Serial Monitor
    Serial.println("------------------------------------------");
    Serial.print("[SENSOR] Temp: ");
    Serial.print(temperature, 1);
    Serial.print(" °C | Humidity: ");
    Serial.print(humidity, 1);
    Serial.println(" %");

    // Transmit data if Wi-Fi is connected
    if (WiFi.status() == WL_CONNECTED) {
      sendReadingToBackend(temperature, humidity);
    } else {
      Serial.println("[WiFi] Cannot transmit reading: Wi-Fi not connected.");
    }
  }
}

// Function to establish Wi-Fi connection with timeout
void connectToWiFi() {
  Serial.print("[WiFi] Connecting to SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttemptTime = millis();
  const unsigned long timeoutMs = 15000; // 15 second timeout

  while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime < timeoutMs)) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink LED while connecting
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH); // Solid ON when connected
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] RSSI Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] Failed to connect within timeout. Will retry in loop.");
  }
}

// Function to construct JSON payload and send HTTP POST
void sendReadingToBackend(float temperature, float humidity) {
  HTTPClient http;

  // Initialize HTTP connection with 5 second timeout
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  // Construct JSON payload
  // Example: {"device_id":"beehive-001","temperature_c":34.5,"humidity_pct":58.2}
  String jsonPayload = "{";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"temperature_c\":" + String(temperature, 2) + ",";
  jsonPayload += "\"humidity_pct\":" + String(humidity, 2);
  jsonPayload += "}";

  Serial.print("[HTTP] Sending POST to: ");
  Serial.println(BACKEND_URL);
  Serial.print("[HTTP] Payload: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    Serial.print("[HTTP] Response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 200 || httpResponseCode == 201) {
      String responseBody = http.getString();
      Serial.print("[HTTP] Response: ");
      Serial.println(responseBody);
      // Quick double blink for transmission success
      digitalWrite(LED_PIN, LOW); delay(50); digitalWrite(LED_PIN, HIGH);
    } else {
      String errorBody = http.getString();
      Serial.print("[HTTP ERROR] Server responded with error: ");
      Serial.println(errorBody);
    }
  } else {
    Serial.print("[HTTP ERROR] Failed to send POST request. Error code: ");
    Serial.print(httpResponseCode);
    Serial.print(" (");
    Serial.print(http.errorToString(httpResponseCode).c_str());
    Serial.println(")");
    Serial.println("[HTTP TIP] Verify backend container is running, LAN IP is correct, and Windows Firewall permits port 8000.");
  }

  http.end(); // Free socket and connection resources
}

