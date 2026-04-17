/*
 * =====================================================
 * GasGuard — NodeMCU (ESP8266) Gas Sensor Sketch
 * =====================================================
 * 
 * Hardware:
 *   - NodeMCU ESP8266
 *   - MQ-2 / MQ-7 / MQ-135 gas sensor connected to A0
 *   - Onboard LED (D4 / GPIO2) for danger indication
 * 
 * Function:
 *   - Reads analog gas sensor value every 2 seconds
 *   - Converts raw ADC to estimated PPM
 *   - Sends HTTP POST to backend API
 *   - Blinks LED when danger threshold exceeded
 *   - Auto-reconnects WiFi on disconnect
 * 
 * JSON Payload sent to server:
 *   {
 *     "sensorId": "MCU-01",
 *     "ppm": 450,
 *     "gasType": "LPG",
 *     "timestamp": "2025-06-01T12:30:00Z"
 *   }
 * 
 * =====================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================

// WiFi credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend server URL
const char* SERVER_URL = "http://YOUR_SERVER_IP:5000/api/sensor/data";

// Sensor configuration
const char* SENSOR_ID   = "MCU-01";
const char* GAS_TYPE    = "LPG";       // LPG, CO, CO2, Methane, etc.
const int   SENSOR_PIN  = A0;          // Analog pin for gas sensor
const int   LED_PIN     = D4;          // Onboard LED (active LOW on NodeMCU)

// Thresholds
const int WARNING_PPM = 400;
const int DANGER_PPM  = 800;

// Timing
const unsigned long SEND_INTERVAL = 2000;  // Send data every 2 seconds (ms)
const unsigned long WIFI_RETRY_INTERVAL = 5000;  // WiFi retry every 5 seconds

// Calibration constants for MQ-2 sensor
// These values should be calibrated for your specific sensor
const float RL_VALUE       = 10.0;     // Load resistance in kilo-ohms
const float RO_CLEAN_AIR   = 9.83;    // Sensor resistance in clean air / RO
const float VOLTAGE_REF    = 3.3;      // ESP8266 ADC reference voltage
const int   ADC_MAX        = 1024;     // 10-bit ADC

// ==================== GLOBAL VARIABLES ====================

unsigned long lastSendTime = 0;
unsigned long lastWifiRetry = 0;
bool ledState = false;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println();
  Serial.println("╔══════════════════════════════════╗");
  Serial.println("║   🔥 GasGuard Sensor Node       ║");
  Serial.println("║   NodeMCU ESP8266                ║");
  Serial.println("╚══════════════════════════════════╝");
  Serial.println();
  
  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // LED off (active LOW)
  
  // Connect to WiFi
  connectWiFi();
  
  // Warm-up time for gas sensor
  Serial.println("⏳ Warming up gas sensor (20 seconds)...");
  for (int i = 20; i > 0; i--) {
    Serial.printf("   %d seconds remaining...\n", i);
    delay(1000);
    // Blink LED during warmup
    digitalWrite(LED_PIN, i % 2 == 0 ? LOW : HIGH);
  }
  digitalWrite(LED_PIN, HIGH);  // LED off
  Serial.println("✅ Sensor ready!");
  Serial.println();
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastWifiRetry >= WIFI_RETRY_INTERVAL) {
      lastWifiRetry = now;
      Serial.println("⚠️ WiFi disconnected. Reconnecting...");
      connectWiFi();
    }
    return;
  }
  
  // Send data at interval
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentTime;
    
    // Read sensor
    int rawValue = analogRead(SENSOR_PIN);
    float ppm = convertToPPM(rawValue);
    
    Serial.printf("📡 Sensor: raw=%d, PPM=%.1f", rawValue, ppm);
    
    // Check danger level
    if (ppm >= DANGER_PPM) {
      Serial.print(" [🚨 DANGER]");
      blinkLED(3, 100);  // Fast blink 3 times
    } else if (ppm >= WARNING_PPM) {
      Serial.print(" [⚠️ WARNING]");
      blinkLED(1, 300);  // Single blink
    } else {
      Serial.print(" [✅ SAFE]");
      digitalWrite(LED_PIN, HIGH);  // LED off
    }
    Serial.println();
    
    // Send to server
    sendData(ppm);
  }
}

// ==================== WiFi CONNECTION ====================

void connectWiFi() {
  Serial.printf("🔌 Connecting to WiFi: %s", WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi connection failed. Will retry...");
  }
}

// ==================== PPM CONVERSION ====================

/**
 * Convert raw ADC reading to estimated PPM
 * 
 * This uses a simplified conversion formula for MQ-series sensors.
 * For accurate results, calibrate with known gas concentrations.
 * 
 * Formula:
 *   1. Convert ADC to voltage
 *   2. Calculate sensor resistance (Rs)
 *   3. Calculate Rs/Ro ratio
 *   4. Use log-linear approximation to get PPM
 */
float convertToPPM(int rawADC) {
  if (rawADC == 0) return 0;
  
  // Convert to voltage
  float voltage = (float)rawADC / ADC_MAX * VOLTAGE_REF;
  
  // Calculate sensor resistance
  float rs = ((VOLTAGE_REF * RL_VALUE) / voltage) - RL_VALUE;
  
  // Rs/Ro ratio
  float ratio = rs / RO_CLEAN_AIR;
  
  // Log-linear approximation for LPG on MQ-2
  // PPM = 10 ^ ((log10(ratio) - b) / m)
  // Typical values for MQ-2 LPG curve: m = -0.47, b = 1.30
  float m = -0.47;
  float b = 1.30;
  
  float ppm = pow(10, ((log10(ratio) - b) / m));
  
  // Clamp to reasonable range
  if (ppm < 0) ppm = 0;
  if (ppm > 10000) ppm = 10000;
  
  return ppm;
}

// ==================== SEND DATA TO SERVER ====================

void sendData(float ppm) {
  WiFiClient client;
  HTTPClient http;
  
  http.begin(client, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);  // 5 second timeout
  
  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["sensorId"] = SENSOR_ID;
  doc["ppm"] = round(ppm * 10) / 10.0;  // 1 decimal place
  doc["gasType"] = GAS_TYPE;
  
  // ISO 8601 timestamp (approximate, no RTC)
  // For accurate timestamps, add an NTP client or use server-side timestamps
  unsigned long uptimeMs = millis();
  char timestamp[32];
  snprintf(timestamp, sizeof(timestamp), "2025-01-01T00:00:%02lu.000Z", 
           (uptimeMs / 1000) % 60);
  doc["timestamp"] = timestamp;
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.printf("   📤 Sending: %s\n", payload.c_str());
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("   ✅ Response [%d]: %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("   ❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

// ==================== LED CONTROL ====================

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);   // LED on (active LOW)
    delay(delayMs);
    digitalWrite(LED_PIN, HIGH);  // LED off
    if (i < times - 1) delay(delayMs);
  }
}
