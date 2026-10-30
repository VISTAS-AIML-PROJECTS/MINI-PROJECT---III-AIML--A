
/*
  AI-Enhanced Smart Gesture Communication Glove
  ESP32 + Random Forest + MPU6050 + 5 Flex Sensors + OLED + Web Dashboard

  Wi-Fi: GestureGlove
  Password: Glove@123
  Dashboard: http://192.168.4.1

  Required libraries:
    - Adafruit GFX Library
    - Adafruit SSD1306

  For actual predictions, add the compatible gesture_model.h file.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#if __has_include("gesture_model.h")
  #include "gesture_model.h"
  #define HAS_RF_MODEL 1
#else
  #define HAS_RF_MODEL 0
#endif

// ---------------- PIN CONFIGURATION ----------------

const uint8_t FLEX_PINS[5] = {33, 32, 35, 34, 36};
const char* FLEX_NAMES[5] = {"Thumb", "Index", "Middle", "Ring", "Little"};

constexpr uint8_t SDA_PIN = 21;
constexpr uint8_t SCL_PIN = 22;

constexpr uint8_t OLED_WIDTH = 128;
constexpr uint8_t OLED_HEIGHT = 64;
constexpr int OLED_RESET = -1;

// ---------------- WI-FI AND WEB SERVER ----------------

const char* AP_SSID = "GestureGlove";
const char* AP_PASSWORD = "Glove@123";

WebServer server(80);

// ---------------- DEVICES AND SENSOR DATA ----------------

Adafruit_SSD1306 display(
  OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET
);

uint8_t mpuAddress = 0;
bool oledOK = false;
bool mpuOK = false;

float features[11] = {0};
int flexValues[5] = {0};

int16_t ax = 0, ay = 0, az = 0;
int16_t gx = 0, gy = 0, gz = 0;

String latestGesture = "Model unavailable";
bool hasPrediction = false;

unsigned long lastSensorReadMs = 0;

// ---------------- WEB DASHBOARD ----------------

const char webpage[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0b1020">
<title>GestureGlove | Dashboard</title>
<style>
:root {
  color-scheme: dark;
  --bg:#0b1020;
  --panel:#131d31;
  --border:#293650;
  --text:#edf3ff;
  --muted:#9aabc6;
  --accent:#67e8c4;
  --blue:#8aa7ff;
}
*{box-sizing:border-box}
body{
  margin:0;min-height:100vh;color:var(--text);
  background:radial-gradient(ellipse at top,#1a2b49,var(--bg) 65%);
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif
}
main{width:min(940px,calc(100% - 28px));margin:auto;padding:28px 0}
header{display:flex;justify-content:space-between;align-items:center;gap:12px}
.brand{display:flex;align-items:center;gap:12px}
.logo{
  width:46px;height:46px;display:grid;place-items:center;
  border-radius:14px;background:var(--accent);color:#07151b;
  font-size:24px;font-weight:900
}
h1{font-size:20px;margin:0;letter-spacing:-.5px}
.sub{font-size:12px;color:var(--muted);margin-top:5px}
.pill{
  border:1px solid var(--border);border-radius:99px;
  padding:9px 12px;background:#111b2d;color:var(--accent);
  font-size:12px;white-space:nowrap
}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;
  background:var(--accent);margin-right:7px}
.hero{
  margin-top:26px;padding:28px;border:1px solid var(--border);
  border-radius:23px;background:linear-gradient(145deg,#192943,#111827);
  box-shadow:0 18px 55px #0002
}
.eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;
  font-weight:750;color:var(--muted)}
.gesture{
  min-height:125px;display:grid;place-items:center;text-align:center;
  overflow-wrap:anywhere;font-size:clamp(32px,7vw,55px);
  font-weight:850;letter-spacing:-1.5px;padding:22px 0
}
.hint{color:var(--muted);font-size:13px;text-align:center;line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:13px;margin-top:13px}
.card,.sensor,.imuitem{
  background:#111a2b;border:1px solid var(--border);border-radius:15px;
  min-width:0
}
.card{padding:18px}
.label,.sensor-name,.imuitem span{font-size:12px;color:var(--muted)}
.value{font-size:16px;font-weight:750;margin-top:9px;overflow-wrap:anywhere}
.small{font-size:11px;color:var(--muted);margin-top:6px}
.section{margin-top:24px}
.section h2{font-size:15px;margin:0 0 12px}
.sensors{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.sensor{padding:14px 12px}
.sensor-num{font-size:19px;font-weight:750;margin-top:8px}
.bar{height:4px;background:#26344c;border-radius:10px;margin-top:12px;overflow:hidden}
.fill{height:100%;width:0%;background:linear-gradient(90deg,var(--blue),var(--accent))}
.imu{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}
.imuitem{padding:12px}
.imuitem b{display:block;font-size:13px;margin-top:7px;overflow-wrap:anywhere}
footer{text-align:center;color:var(--muted);font-size:11px;
  line-height:1.7;margin-top:25px}
@media(max-width:680px){
  .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sensors{grid-template-columns:repeat(2,minmax(0,1fr))}
  .imu{grid-template-columns:repeat(3,minmax(0,1fr))}
  .hero{padding:22px}
}
@media(max-width:400px){
  main{width:calc(100% - 20px);padding-top:18px}
  .pill{font-size:10px;padding:7px}
  .card{padding:14px}
}
</style>
</head>
<body>
<main>
<header>
  <div class="brand">
    <div class="logo">G</div>
    <div>
      <h1>GestureGlove</h1>
      <div class="sub">AI-Enhanced Assistive Communication</div>
    </div>
  </div>
  <div class="pill"><span class="dot"></span><span id="connection">Connecting</span></div>
</header>

<section class="hero">
  <div class="eyebrow">Live recognition output</div>
  <div class="gesture" id="gesture">Connecting to glove...</div>
  <div class="hint" id="hint">Waiting for live device data.</div>
</section>

<section class="grid">
  <div class="card">
    <div class="label">Random Forest model</div>
    <div class="value" id="model">Checking...</div>
    <div class="small">Inference status</div>
  </div>
  <div class="card">
    <div class="label">MPU6050</div>
    <div class="value" id="mpu">Checking...</div>
    <div class="small">Motion sensor</div>
  </div>
  <div class="card">
    <div class="label">OLED display</div>
    <div class="value" id="oled">Checking...</div>
    <div class="small">SSD1306 I2C</div>
  </div>
</section>

<section class="section">
  <h2>Flex sensor readings <span style="color:#9aabc6;font-size:11px;font-weight:400">· raw ADC</span></h2>
  <div class="sensors" id="sensors"></div>
</section>

<section class="section">
  <h2>Motion sensor readings <span style="color:#9aabc6;font-size:11px;font-weight:400">· raw values</span></h2>
  <div class="imu" id="imu"></div>
</section>

<footer>
  GestureGlove · ESP32 local dashboard · No cloud required<br>
  Automatic updates · <span id="updated">Waiting for data</span>
</footer>
</main>

<script>
const flexNames=["Thumb","Index","Middle","Ring","Little"];
const imuNames=["Accel X","Accel Y","Accel Z","Gyro X","Gyro Y","Gyro Z"];

function buildCards(){
  document.getElementById("sensors").innerHTML=flexNames.map((n,i)=>
    `<div class="sensor">
      <div class="sensor-name">${n}</div>
      <div class="sensor-num" id="f${i}">—</div>
      <div class="bar"><div class="fill" id="b${i}"></div></div>
    </div>`).join("");

  document.getElementById("imu").innerHTML=imuNames.map((n,i)=>
    `<div class="imuitem"><span>${n}</span><b id="i${i}">—</b></div>`).join("");
}

async function refresh(){
  try{
    const response=await fetch("/api/status",{cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const d=await response.json();

    document.getElementById("connection").textContent="Device online";
    document.getElementById("gesture").textContent=d.gesture;
    document.getElementById("model").textContent=d.modelLoaded?"Loaded":"Not installed";
    document.getElementById("mpu").textContent=d.mpuOK?"Connected":"Not detected";
    document.getElementById("oled").textContent=d.oledOK?"Detected":"Not detected";

    document.getElementById("hint").textContent =
      d.hasPrediction
      ? "Latest class returned by the Random Forest model."
      : d.modelLoaded
        ? "Model loaded; waiting for a valid prediction."
        : "Sensor monitoring is active, but the trained model header is missing.";

    d.flex.forEach((v,i)=>{
      document.getElementById("f"+i).textContent=v;
      document.getElementById("b"+i).style.width=
        Math.max(0,Math.min(100,v/4095*100))+"%";
    });

    d.imu.forEach((v,i)=>{
      document.getElementById("i"+i).textContent=v;
    });

    document.getElementById("updated").textContent=
      "Last update "+new Date().toLocaleTimeString();
  }catch(e){
    document.getElementById("connection").textContent="Reconnecting";
    document.getElementById("hint").textContent=
      "Cannot reach ESP32. Check your Wi-Fi connection.";
  }
}

buildCards();
refresh();
setInterval(refresh,700);
</script>
</body>
</html>
)HTML";

// ---------------- I2C HELPERS ----------------

bool findI2C(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

int16_t readWord() {
  uint16_t hi = (uint8_t)Wire.read();
  uint16_t lo = (uint8_t)Wire.read();
  return (int16_t)((hi << 8) | lo);
}

// ---------------- MPU6050 ----------------

bool readMPU() {
  if (!mpuOK) return false;

  Wire.beginTransmission(mpuAddress);
  Wire.write(0x3B);

  if (Wire.endTransmission(false) != 0) return false;

  if (Wire.requestFrom(mpuAddress, (uint8_t)14, (uint8_t)true) != 14) {
    return false;
  }

  ax = readWord();
  ay = readWord();
  az = readWord();
  (void)readWord();  // Temperature
  gx = readWord();
  gy = readWord();
  gz = readWord();

  return true;
}

// ---------------- FLEX SENSORS ----------------

int readFlex(uint8_t pin) {
  uint32_t total = 0;

  for (int i = 0; i < 8; ++i) {
    total += analogRead(pin);
    delayMicroseconds(200);
  }

  return (int)(total / 8);
}

void readFeatures() {
  for (int i = 0; i < 5; ++i) {
    flexValues[i] = readFlex(FLEX_PINS[i]);
    features[i] = (float)flexValues[i];
  }

  if (readMPU()) {
    features[5] = (float)ax;
    features[6] = (float)ay;
    features[7] = (float)az;
    features[8] = (float)gx;
    features[9] = (float)gy;
    features[10] = (float)gz;
  } else {
    for (int i = 5; i < 11; ++i) {
      features[i] = 0.0f;
    }
  }
}

// ---------------- RANDOM FOREST INFERENCE ----------------

#if HAS_RF_MODEL

int predictRandomForest(const float* x) {
  int votes[RF_N_CLASSES] = {0};

  for (int t = 0; t < RF_N_TREES; ++t) {
    int node = 0;
    const int base = RF_TREE_OFFSETS[t];
    const int end = RF_TREE_OFFSETS[t + 1];

    while (node >= 0 && node < RF_NODE_COUNT[t]) {
      const int globalNode = base + node;

      if (globalNode < base || globalNode >= end) break;

      const int left = RF_LEFT[globalNode];
      const int right = RF_RIGHT[globalNode];

      // Leaf node
      if (left == -1 || right == -1) {
        int bestClass = 0;
        uint8_t bestVote = 0;

        for (int c = 0; c < RF_N_CLASSES; ++c) {
          uint8_t v =
            RF_LEAF_VOTES[globalNode * RF_N_CLASSES + c];

          if (v > bestVote) {
            bestVote = v;
            bestClass = c;
          }
        }

        votes[bestClass]++;
        break;
      }

      const int featureIndex = RF_FEATURE[globalNode];

      if (featureIndex < 0 || featureIndex >= 11) break;

      node = (x[featureIndex] <= RF_THRESHOLD[globalNode])
             ? left : right;
    }
  }

  int best = 0;

  for (int c = 1; c < RF_N_CLASSES; ++c) {
    if (votes[c] > votes[best]) best = c;
  }

  return best;
}

#endif

// ---------------- OLED DISPLAY ----------------

void showDisplay(const char* prediction, bool predictionAvailable) {
  if (!oledOK) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);

  display.println("SMART GESTURE GLOVE");
  display.println("-------------------");

#if HAS_RF_MODEL
  display.print("RF: ");
  display.println(predictionAvailable ? prediction : "Waiting...");
#else
  display.println("MODEL NOT INSTALLED");
  display.println("Sensor diagnostics");
#endif

  display.print("T:"); display.print(flexValues[0]);
  display.print(" I:"); display.println(flexValues[1]);

  display.print("M:"); display.print(flexValues[2]);
  display.print(" R:"); display.println(flexValues[3]);

  display.print("L:"); display.println(flexValues[4]);

  display.print("IMU:");
  display.println(mpuOK ? "OK" : "MISSING");

  display.display();
}

// ---------------- JSON AND WEB HANDLERS ----------------

String jsonEscape(const String& input) {
  String output;
  output.reserve(input.length() + 8);

  for (unsigned int i = 0; i < input.length(); ++i) {
    const char c = input[i];

    if (c == '"' || c == '\\') {
      output += '\\';
      output += c;
    } else if (c == '\n') {
      output += "\\n";
    } else if (c == '\r') {
      output += "\\r";
    } else if ((uint8_t)c >= 32) {
      output += c;
    }
  }

  return output;
}

void handleRoot() {
  server.send_P(200, "text/html; charset=utf-8", webpage);
}

void handleStatus() {
  String json;
  json.reserve(350);

  json = "{\"gesture\":\"";
  json += jsonEscape(latestGesture);
  json += "\",\"hasPrediction\":";
  json += (hasPrediction ? "true" : "false");

  json += ",\"modelLoaded\":";
  json += (HAS_RF_MODEL ? "true" : "false");

  json += ",\"mpuOK\":";
  json += (mpuOK ? "true" : "false");

  json += ",\"oledOK\":";
  json += (oledOK ? "true" : "false");

  json += ",\"flex\":[";
  for (int i = 0; i < 5; ++i) {
    if (i > 0) json += ",";
    json += String(flexValues[i]);
  }

  json += "],\"imu\":[";
  json += String(ax); json += ",";
  json += String(ay); json += ",";
  json += String(az); json += ",";
  json += String(gx); json += ",";
  json += String(gy); json += ",";
  json += String(gz);
  json += "]}";

  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", json);
}

// ---------------- SETUP ----------------

void setup() {
  Serial.begin(115200);
  delay(800);

  Serial.println("\nAI Gesture Glove: startup");

  analogReadResolution(12);

  for (int i = 0; i < 5; ++i) {
    analogSetPinAttenuation(FLEX_PINS[i], ADC_11db);
  }

  // Initialize I2C bus.
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);

  // Detect OLED. The program continues if it is missing.
  if (findI2C(0x3C)) {
    oledOK = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  } else if (findI2C(0x3D)) {
    oledOK = display.begin(SSD1306_SWITCHCAPVCC, 0x3D);
  }

  // Detect and wake MPU6050.
  if (findI2C(0x68)) {
    mpuAddress = 0x68;
  } else if (findI2C(0x69)) {
    mpuAddress = 0x69;
  }

  if (mpuAddress != 0) {
    Wire.beginTransmission(mpuAddress);
    Wire.write(0x6B);
    Wire.write(0x00);
    mpuOK = (Wire.endTransmission() == 0);
  }

  Serial.print("OLED: ");
  Serial.println(oledOK ? "OK" : "NOT FOUND");

  Serial.print("MPU6050: ");
  Serial.println(mpuOK ? "OK" : "NOT FOUND");

#if HAS_RF_MODEL
  Serial.println("Random Forest model: LOADED");
  latestGesture = "Waiting for gesture";
#else
  Serial.println("MODEL HEADER MISSING: diagnostics only; no predictions.");
  latestGesture = "Model unavailable";
#endif

  // Start ESP32 Wi-Fi access point.
  WiFi.mode(WIFI_AP);

  if (WiFi.softAP(AP_SSID, AP_PASSWORD)) {
    Serial.println("\nWi-Fi access point started");
    Serial.print("Network: ");
    Serial.println(AP_SSID);

    Serial.print("Password: ");
    Serial.println(AP_PASSWORD);

    Serial.print("Dashboard: http://");
    Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("ERROR: Could not start Wi-Fi access point");
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.begin();

  Serial.println("Web server started");
}

// ---------------- MAIN LOOP ----------------

void loop() {
  // Keep the dashboard responsive.
  server.handleClient();

  const unsigned long now = millis();

  // Sample sensors every 100 ms.
  if (now - lastSensorReadMs < 100) return;
  lastSensorReadMs = now;

  readFeatures();

  // Serial diagnostics.
  Serial.print("Flex\t");

  for (int i = 0; i < 5; ++i) {
    Serial.print(flexValues[i]);
    Serial.print('\t');
  }

  Serial.print("IMU\t");
  Serial.print(ax); Serial.print('\t');
  Serial.print(ay); Serial.print('\t');
  Serial.print(az); Serial.print('\t');
  Serial.print(gx); Serial.print('\t');
  Serial.print(gy); Serial.print('\t');
  Serial.println(gz);

  const char* prediction = "";
  hasPrediction = false;

#if HAS_RF_MODEL
  const int classIndex = predictRandomForest(features);

  if (classIndex >= 0 && classIndex < RF_N_CLASSES) {
    prediction = RF_CLASS_NAMES[classIndex];
    latestGesture = String(prediction);
    hasPrediction = true;

    Serial.print("Prediction: ");
    Serial.println(prediction);
  } else {
    latestGesture = "Prediction unavailable";
  }
#else
  latestGesture = "Model unavailable";
#endif

  // OLED is optional; web dashboard keeps working without it.
  showDisplay(prediction, hasPrediction);
}
