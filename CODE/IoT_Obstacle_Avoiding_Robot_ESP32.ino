/*
  ESP32 Cloud Telemetry Bridge for the IoT Smart Obstacle Avoiding Robot
  Receives telemetry from Arduino UNO over Serial2 and posts it to ThingSpeak.
  Before uploading: set WIFI_SSID, WIFI_PASSWORD and THINGSPEAK_WRITE_API_KEY.
*/
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* THINGSPEAK_WRITE_API_KEY = "YOUR_THINGSPEAK_WRITE_API_KEY";

// ESP32 RX2 GPIO16 receives Arduino UNO TX through a 5V-to-3.3V divider.
const int UNO_RX_PIN = 16;
const int UNO_TX_PIN = 17; // not used; keep free or connect for two-way serial later
unsigned long lastUploadMs = 0;
const unsigned long UPLOAD_INTERVAL_MS = 20000; // ThingSpeak free-channel safe interval

String latestLine = "";

String valueFor(const String& line, const String& key) {
  String token = key + "=";
  int start = line.indexOf(token);
  if (start < 0) return "";
  start += token.length();
  int end = line.indexOf(';', start);
  return (end < 0) ? line.substring(start) : line.substring(start, end);
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void uploadTelemetry(const String& line) {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  String distance = valueFor(line, "distance");
  String left = valueFor(line, "left");
  String right = valueFor(line, "right");
  String state = valueFor(line, "state");

  String url = "http://api.thingspeak.com/update?api_key=" + String(THINGSPEAK_WRITE_API_KEY) +
               "&field1=" + distance + "&field2=" + left + "&field3=" + right +
               "&field4=" + state;
  HTTPClient http;
  http.begin(url);
  int status = http.GET();
  Serial.print("ThingSpeak HTTP status: "); Serial.println(status);
  http.end();
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, UNO_RX_PIN, UNO_TX_PIN);
  connectWiFi();
  Serial.println("ESP32 telemetry bridge ready");
}

void loop() {
  while (Serial2.available()) {
    char c = (char)Serial2.read();
    if (c == '\n') {
      latestLine.trim();
      Serial.println(latestLine);
      if (latestLine.length() && millis() - lastUploadMs >= UPLOAD_INTERVAL_MS) {
        uploadTelemetry(latestLine);
        lastUploadMs = millis();
      }
      latestLine = "";
    } else {
      latestLine += c;
    }
  }
}
