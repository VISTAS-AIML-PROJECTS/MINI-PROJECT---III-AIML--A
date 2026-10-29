/*
 ==============================================================
       SMART GRAIN STORAGE MONITORING SYSTEM
       ESP32 + DHT22 + MQ135 + Moisture + LCD
       + 3 STATUS LEDs + 5V BUZZER + WEB DASHBOARD

       GREEN  = NORMAL
       YELLOW = WARNING
       RED    = CRITICAL
       BUZZER = CRITICAL

       WEB DASHBOARD FEATURES:
       - Live sensor monitoring
       - Warning/Critical reasons
       - Automatic recommendations
       - Auto/Manual mode
       - LED control
       - Buzzer control
       - Hardware test
       - Responsive dashboard
       - UTF-8 emoji support

 ==============================================================
*/

// ============================================================
// LIBRARIES
// ============================================================

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ============================================================
// WIFI
// ============================================================

const char* WIFI_SSID = "gokul";
const char* WIFI_PASSWORD = "gokul@17";

// Google Sheets logging (configure after deploying the Apps Script web app).
// Paste the deployed URL ending in /exec; placeholder disables cloud logging.
const char* GOOGLE_SHEETS_WEB_APP_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
const char* GOOGLE_SHEETS_SECRET = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";
const unsigned long GOOGLE_SHEETS_LOG_INTERVAL = 60000; // 1 minute
unsigned long lastGoogleSheetsLog = 0;

// ============================================================
// PIN DEFINITIONS
// ============================================================

// DHT22
#define DHT_PIN 4
#define DHT_TYPE DHT22

// MQ135
#define MQ135_AO 36
#define MQ135_DO 27

// Moisture
#define MOISTURE_PIN 34

// 3 STATUS LEDs
#define GREEN_LED_PIN 25
#define YELLOW_LED_PIN 26
#define RED_LED_PIN 32

// Buzzer
#define BUZZER_PIN 33

// LCD
#define SDA_PIN 21
#define SCL_PIN 22

// ESP32 onboard LED
#define ONBOARD_LED_PIN 2

// ============================================================
// OBJECTS
// ============================================================

DHT dht(DHT_PIN, DHT_TYPE);

WebServer server(80);

LiquidCrystal_I2C* lcd = nullptr;

uint8_t lcdAddress = 0;

// ============================================================
// SENSOR VARIABLES
// ============================================================

float temperature = NAN;
float humidity = NAN;

int gasRaw = 0;
int gasPercent = 0;

int moistureRaw = 0;
int moisturePercent = 0;

bool gasDigitalAlarm = false;
bool temperatureValid = false;
bool humidityValid = false;

// ============================================================
// SYSTEM VARIABLES
// ============================================================

bool autoMode = true;

bool greenLEDState = false;
bool yellowLEDState = false;
bool redLEDState = false;

bool buzzerState = false;

String systemStatus = "STARTING";

// ============================================================
// THRESHOLDS
// ============================================================

// Temperature
const float TEMP_WARNING = 35.0;
const float TEMP_CRITICAL = 40.0;

// Humidity
const float HUM_WARNING = 70.0;
const float HUM_CRITICAL = 80.0;

// MQ-135 raw ADC thresholds (0-4095). These are starting values, not ppm.
const int GAS_WARNING_RAW = 700;
const int GAS_CRITICAL_RAW = 899;

// Calibrated moisture percentage thresholds
const int MOISTURE_WARNING = 60;
const int MOISTURE_CRITICAL = 75;

// Calibrate these raw values using your own sensor in dry and wet conditions.
// Current project baseline: dry=1200, wet=3000.
const int MOISTURE_DRY_RAW = 1200;
const int MOISTURE_WET_RAW = 3000;

// ============================================================
// TIMERS
// ============================================================

unsigned long lastSensorRead = 0;
unsigned long lastLCDUpdate = 0;

const unsigned long SENSOR_INTERVAL = 2000;
const unsigned long LCD_INTERVAL = 3000;

// ============================================================
// LCD
// ============================================================

int lcdScreen = 0;

// ============================================================
// BUZZER
// ============================================================

bool buzzerOutput = false;

unsigned long lastBuzzerMicros = 0;

const unsigned long BUZZER_HALF_PERIOD = 250;

// ============================================================
// LCD ADDRESS DETECTION
// ============================================================

bool deviceExists(uint8_t address)
{
  Wire.beginTransmission(address);

  return Wire.endTransmission() == 0;
}

// ============================================================
// LCD INITIALIZATION
// ============================================================

void initializeLCD()
{
  Serial.println();
  Serial.println("Searching for LCD...");

  if (deviceExists(0x27))
  {
    lcdAddress = 0x27;
  }
  else if (deviceExists(0x3F))
  {
    lcdAddress = 0x3F;
  }
  else
  {
    for (uint8_t address = 0x20;
         address <= 0x27;
         address++)
    {
      if (deviceExists(address))
      {
        lcdAddress = address;
        break;
      }
    }
  }

  if (lcdAddress != 0)
  {
    Serial.print("LCD found at 0x");
    Serial.println(lcdAddress, HEX);

    lcd = new LiquidCrystal_I2C(
      lcdAddress,
      16,
      2
    );

    lcd->init();
    lcd->backlight();
    lcd->clear();

    lcd->setCursor(0, 0);
    lcd->print("Smart Grain");

    lcd->setCursor(0, 1);
    lcd->print("Storage System");

    delay(2000);

    lcd->clear();
  }
  else
  {
    Serial.println("LCD NOT FOUND!");
    Serial.println("Check SDA=21 SCL=22 VCC GND");
  }
}

// ============================================================
// LED CONTROL
// ============================================================

void setGreenLED(bool state)
{
  greenLEDState = state;
  digitalWrite(GREEN_LED_PIN, state ? HIGH : LOW);
}

void setYellowLED(bool state)
{
  yellowLEDState = state;
  digitalWrite(YELLOW_LED_PIN, state ? HIGH : LOW);
}

void setRedLED(bool state)
{
  redLEDState = state;
  digitalWrite(RED_LED_PIN, state ? HIGH : LOW);
}

void allLEDsOff()
{
  setGreenLED(false);
  setYellowLED(false);
  setRedLED(false);
}

// ============================================================
// BUZZER
// ============================================================

void stopBuzzer()
{
  buzzerState = false;
  buzzerOutput = false;

  digitalWrite(BUZZER_PIN, LOW);
}

void startBuzzer()
{
  buzzerState = true;
}

void updateBuzzer()
{
  if (!buzzerState)
  {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOutput = false;
    return;
  }

  unsigned long now = micros();

  if (now - lastBuzzerMicros >= BUZZER_HALF_PERIOD)
  {
    lastBuzzerMicros = now;

    buzzerOutput = !buzzerOutput;

    digitalWrite(
      BUZZER_PIN,
      buzzerOutput ? HIGH : LOW
    );
  }
}

// ============================================================
// READ SENSORS
// ============================================================

void readSensors()
{
  // ----------------------------------------------------------
  // DHT22
  // ----------------------------------------------------------

  float newTemperature = dht.readTemperature();
  float newHumidity = dht.readHumidity();

  temperatureValid = !isnan(newTemperature);
  humidityValid = !isnan(newHumidity);

  // Mark failed readings invalid instead of displaying stale values as live.
  temperature = temperatureValid ? newTemperature : NAN;
  humidity = humidityValid ? newHumidity : NAN;

  // ----------------------------------------------------------
  // MQ135
  // ----------------------------------------------------------

  gasRaw = analogRead(MQ135_AO);

  gasPercent = map(
    gasRaw,
    0,
    4095,
    0,
    100
  );

  gasPercent = constrain(
    gasPercent,
    0,
    100
  );

  // MQ135 digital alarm
  gasDigitalAlarm =
    digitalRead(MQ135_DO) == LOW;

  // ----------------------------------------------------------
  // MOISTURE
  // ----------------------------------------------------------

  moistureRaw = analogRead(MOISTURE_PIN);

  // Convert the calibrated sensor range to 0-100%.
  // If your sensor reads lower when wet, swap the dry/wet constants.
  moisturePercent = map(
    moistureRaw,
    MOISTURE_DRY_RAW,
    MOISTURE_WET_RAW,
    0,
    100
  );

  moisturePercent = constrain(
    moisturePercent,
    0,
    100
  );

  // ----------------------------------------------------------
  // SERIAL
  // ----------------------------------------------------------

  Serial.println();
  Serial.println("========== SENSOR DATA ==========");

  Serial.print("Temperature : ");

  if (isnan(temperature))
    Serial.println("ERROR");
  else
  {
    Serial.print(temperature, 1);
    Serial.println(" C");
  }

  Serial.print("Humidity    : ");

  if (isnan(humidity))
    Serial.println("ERROR");
  else
  {
    Serial.print(humidity, 1);
    Serial.println(" %");
  }

  Serial.print("Gas Raw     : ");
  Serial.println(gasRaw);

  Serial.print("Gas Level   : ");
  Serial.print(gasPercent);
  Serial.println(" %");

  Serial.print("Gas Digital : ");
  Serial.println(
    gasDigitalAlarm ? "ALARM" : "NORMAL"
  );

  Serial.print("Moisture Raw: ");
  Serial.println(moistureRaw);

  Serial.print("Moisture    : ");
  Serial.print(moisturePercent);
  Serial.println(" %");

  Serial.println("=================================");
}

// ============================================================
// UPDATE STATUS
// ============================================================

void updateSystemStatus()
{
  bool critical = false;
  bool warning = false;

  // Temperature
  if (!isnan(temperature))
  {
    if (temperature >= TEMP_CRITICAL)
      critical = true;

    else if (temperature >= TEMP_WARNING)
      warning = true;
  }

  // Humidity
  if (!isnan(humidity))
  {
    if (humidity >= HUM_CRITICAL)
      critical = true;

    else if (humidity >= HUM_WARNING)
      warning = true;
  }

  // Gas
  if (
    gasRaw >= GAS_CRITICAL_RAW ||
    gasDigitalAlarm
  )
  {
    critical = true;
  }
  else if (gasRaw >= GAS_WARNING_RAW)
  {
    warning = true;
  }

  // Moisture
  if (moisturePercent >= MOISTURE_CRITICAL)
  {
    critical = true;
  }
  else if (moisturePercent >= MOISTURE_WARNING)
  {
    warning = true;
  }

  // Final status
  // A failed DHT reading is a sensor fault, not proof of safe conditions.
  bool sensorFault = !temperatureValid || !humidityValid;

  if (critical)
    systemStatus = "CRITICAL";

  else if (sensorFault)
    systemStatus = "SENSOR ERROR";

  else if (warning)
    systemStatus = "WARNING";

  else
    systemStatus = "NORMAL";

  if (sensorFault)
    critical = true;  // Fail-safe: indicate a fault using the red LED/buzzer.

  // ----------------------------------------------------------
  // AUTO OUTPUTS
  // ----------------------------------------------------------

  if (autoMode)
  {
    if (critical)
    {
      setGreenLED(false);
      setYellowLED(false);
      setRedLED(true);

      startBuzzer();
    }

    else if (warning)
    {
      setGreenLED(false);
      setYellowLED(true);
      setRedLED(false);

      stopBuzzer();
    }

    else
    {
      setGreenLED(true);
      setYellowLED(false);
      setRedLED(false);

      stopBuzzer();
    }
  }
}

// ============================================================
// GET REASON
// ============================================================

String getReason()
{
  String reason = "";

  if (!isnan(temperature))
  {
    if (temperature >= TEMP_CRITICAL)
    {
      reason += "High temperature (" +
                String(temperature, 1) +
                " C)";
    }
    else if (temperature >= TEMP_WARNING)
    {
      reason += "Temperature warning (" +
                String(temperature, 1) +
                " C)";
    }
  }

  if (!isnan(humidity))
  {
    if (humidity >= HUM_CRITICAL)
    {
      if (reason.length() > 0) reason += " | ";

      reason += "High humidity (" +
                String(humidity, 1) +
                "%)";
    }
    else if (humidity >= HUM_WARNING)
    {
      if (reason.length() > 0) reason += " | ";

      reason += "Humidity high (" +
                String(humidity, 1) +
                "%)";
    }
  }

  if (
    gasRaw >= GAS_CRITICAL_RAW ||
    gasDigitalAlarm
  )
  {
    if (reason.length() > 0) reason += " | ";

    reason += "High gas sensor reading (raw " +
              String(gasRaw) +
              ")";
  }
  else if (gasRaw >= GAS_WARNING_RAW)
  {
    if (reason.length() > 0) reason += " | ";

    reason += "Gas sensor reading elevated (raw " +
              String(gasRaw) +
              ")";
  }

  if (moisturePercent >= MOISTURE_CRITICAL)
  {
    if (reason.length() > 0) reason += " | ";

    reason += "High moisture (" +
              String(moisturePercent) +
              "%)";
  }
  else if (moisturePercent >= MOISTURE_WARNING)
  {
    if (reason.length() > 0) reason += " | ";

    reason += "Moisture elevated (" +
              String(moisturePercent) +
              "%)";
  }

  if (!temperatureValid || !humidityValid)
  {
    if (reason.length() > 0) reason += " | ";
    reason += "DHT22 sensor reading failed; check wiring and sensor power";
  }

  if (reason.length() == 0)
  {
    reason = "All monitored parameters are within normal range.";
  }

  return reason;
}

// ============================================================
// RECOMMENDATIONS
// ============================================================

String getRecommendations()
{
  String rec = "";

  if (!isnan(temperature))
  {
    if (temperature >= TEMP_CRITICAL)
    {
      rec += "Reduce storage temperature immediately. ";
      rec += "Improve ventilation or activate cooling. ";
    }
    else if (temperature >= TEMP_WARNING)
    {
      rec += "Increase ventilation and monitor temperature closely. ";
    }
  }

  if (!isnan(humidity))
  {
    if (humidity >= HUM_CRITICAL)
    {
      rec += "Humidity is critically high. Check ventilation and moisture entry. ";
    }
    else if (humidity >= HUM_WARNING)
    {
      rec += "Reduce humidity and improve airflow inside the storage area. ";
    }
  }

  if (gasRaw >= GAS_CRITICAL_RAW || gasDigitalAlarm)
  {
    rec += "MQ-135 reading is high (raw ADC). Check grain condition and ventilation; this sensor is not a calibrated ppm meter. ";
  }
  else if (gasRaw >= GAS_WARNING_RAW)
  {
    rec += "MQ-135 reading is elevated. Continue monitoring and compare with a warmed-up, calibrated baseline. ";
  }

  if (moisturePercent >= MOISTURE_CRITICAL)
  {
    rec += "Moisture is critically high. Inspect grain moisture and consider drying before storage. ";
  }
  else if (moisturePercent >= MOISTURE_WARNING)
  {
    rec += "Moisture is elevated. Check grain moisture and improve storage conditions. ";
  }

  if (!temperatureValid || !humidityValid)
  {
    rec += "Check DHT22 wiring, power and data connection; do not treat missing readings as safe. ";
  }

  if (rec.length() == 0)
  {
    rec = "Storage conditions are currently suitable. Continue regular monitoring.";
  }

  return rec;
}

// ============================================================
// LCD UPDATE
// ============================================================

void updateLCD()
{
  if (lcd == nullptr)
    return;

  if (
    millis() - lastLCDUpdate <
    LCD_INTERVAL
  )
    return;

  lastLCDUpdate = millis();

  lcd->clear();

  if (lcdScreen == 0)
  {
    lcd->setCursor(0, 0);

    if (isnan(temperature))
      lcd->print("Temp: ERROR");
    else
    {
      lcd->print("Temp:");
      lcd->print(temperature, 1);
      lcd->print((char)223);
      lcd->print("C");
    }

    lcd->setCursor(0, 1);

    if (isnan(humidity))
      lcd->print("Hum: ERROR");
    else
    {
      lcd->print("Hum:");
      lcd->print(humidity, 1);
      lcd->print("%");
    }
  }

  else if (lcdScreen == 1)
  {
    lcd->setCursor(0, 0);

    lcd->print("Gas:");
    lcd->print(gasPercent);
    lcd->print("%");

    lcd->setCursor(0, 1);

    if (gasDigitalAlarm)
      lcd->print("GAS ALARM!");
    else
      lcd->print("Gas Normal");
  }

  else if (lcdScreen == 2)
  {
    lcd->setCursor(0, 0);

    lcd->print("Moist:");
    lcd->print(moisturePercent);
    lcd->print("%");

    lcd->setCursor(0, 1);

    lcd->print("Status:");
    lcd->print(systemStatus);
  }

  else if (lcdScreen == 3)
  {
    lcd->setCursor(0, 0);

    if (autoMode)
      lcd->print("Mode: AUTO");
    else
      lcd->print("Mode: MANUAL");

    lcd->setCursor(0, 1);

    lcd->print("G:");
    lcd->print(greenLEDState ? "1" : "0");

    lcd->print(" Y:");
    lcd->print(yellowLEDState ? "1" : "0");

    lcd->print(" R:");
    lcd->print(redLEDState ? "1" : "0");
  }

  lcdScreen++;

  if (lcdScreen > 3)
    lcdScreen = 0;
}

// ============================================================
// CORS
// ============================================================

void addCORS()
{
  server.sendHeader(
    "Access-Control-Allow-Origin",
    "*"
  );
}

// ============================================================
// WEB DASHBOARD
// ============================================================

void handleRoot()
{
  String html = R"rawliteral(
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Smart Grain Storage</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

.container {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
}

/* HEADER */

.header {
  background: linear-gradient(135deg,#14532d,#166534);
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}

.header h1 {
  margin: 0;
  font-size: 30px;
}

.header p {
  margin-bottom: 0;
  opacity: .8;
}

/* STATUS */

.status {
  border-radius: 20px;
  padding: 22px;
  text-align: center;
  margin-bottom: 18px;
  font-size: 25px;
  font-weight: bold;
}

.normal {
  background: linear-gradient(135deg,#15803d,#22c55e);
}

.warning {
  background: linear-gradient(135deg,#ca8a04,#facc15);
  color: #111827;
}

.critical {
  background: linear-gradient(135deg,#991b1b,#ef4444);
}

/* SENSOR GRID */

.grid {
  display: grid;
  grid-template-columns:
  repeat(auto-fit,minmax(220px,1fr));
  gap: 16px;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 8px 25px rgba(0,0,0,.2);
}

.card-title {
  color: #94a3b8;
  font-size: 15px;
}

.value {
  font-size: 35px;
  font-weight: bold;
  margin-top: 10px;
}

.bar {
  width: 100%;
  height: 8px;
  background: #334155;
  border-radius: 10px;
  margin-top: 15px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  width: 0%;
  background: #22c55e;
  transition: width .5s;
}

/* INFORMATION */

.info-grid {
  display: grid;
  grid-template-columns:
  repeat(auto-fit,minmax(300px,1fr));
  gap: 16px;
  margin-top: 18px;
}

.panel {
  background: #1e293b;
  border-radius: 20px;
  padding: 22px;
  border: 1px solid #334155;
}

.panel h2 {
  margin-top: 0;
}

/* REASON */

.reason {
  background: #331b1b;
  border-left: 5px solid #ef4444;
  padding: 15px;
  border-radius: 10px;
  line-height: 1.6;
}

/* RECOMMENDATION */

.recommendation {
  background: #172554;
  border-left: 5px solid #3b82f6;
  padding: 16px;
  border-radius: 10px;
  line-height: 1.7;
}

/* CONTROL */

.controls {
  margin-top: 18px;
  background: #1e293b;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid #334155;
}

button {
  border: none;
  border-radius: 12px;
  padding: 13px 18px;
  margin: 5px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: .2s;
}

button:hover {
  transform: translateY(-2px);
  opacity: .9;
}

.blue {
  background: #2563eb;
  color: white;
}

.green {
  background: #16a34a;
  color: white;
}

.yellow {
  background: #eab308;
  color: #111827;
}

.red {
  background: #dc2626;
  color: white;
}

.purple {
  background: #7c3aed;
  color: white;
}

/* FOOTER */

.footer {
  text-align: center;
  color: #64748b;
  padding: 25px;
}

.small {
  color: #94a3b8;
  font-size: 13px;
}

</style>

</head>

<body>

<div class="container">

<!-- HEADER -->

<div class="header">

<h1>🌾 Smart Grain Storage</h1>

<p>
AI & IoT based grain storage condition monitoring
</p>

<p class="small">
ESP32 Local Monitoring & Control Dashboard
</p>

</div>

<!-- STATUS -->

<div id="status"
class="status normal">

CONNECTING...

</div>

<!-- SENSOR CARDS -->

<div class="grid">

<div class="card">

<div class="card-title">
🌡️ TEMPERATURE
</div>

<div class="value"
id="temp">
-- °C
</div>

<div class="bar">
<div id="tempBar"
class="bar-fill">
</div>
</div>

</div>


<div class="card">

<div class="card-title">
💧 HUMIDITY
</div>

<div class="value"
id="humidity">
-- %
</div>

<div class="bar">
<div id="humBar"
class="bar-fill">
</div>
</div>

</div>


<div class="card">

<div class="card-title">
🧪 GAS LEVEL
</div>

<div class="value"
id="gas">
-- %
</div>

<div class="bar">
<div id="gasBar"
class="bar-fill">
</div>
</div>

</div>


<div class="card">

<div class="card-title">
🌱 MOISTURE
</div>

<div class="value"
id="moisture">
-- %
</div>

<div class="bar">
<div id="moistBar"
class="bar-fill">
</div>
</div>

</div>

</div>

<!-- REASON + RECOMMENDATION -->

<div class="info-grid">

<div class="panel">

<h2>⚠️ Condition Analysis</h2>

<div id="reason"
class="reason">

Waiting for sensor data...

</div>

</div>


<div class="panel">

<h2>💡 Recommendations</h2>

<div id="recommendation"
class="recommendation">

Analysing storage conditions...

</div>

</div>

</div>


<!-- SENSOR DETAILS -->

<div class="info-grid">

<div class="panel">

<h2>📊 Sensor Details</h2>

<p>
<b>MQ-135 Raw:</b>
<span id="gasRaw">--</span>
</p>

<p>
<b>MQ-135 Digital:</b>
<span id="gasDigital">--</span>
</p>

<p>
<b>Moisture Raw:</b>
<span id="moistRaw">--</span>
</p>

</div>


<div class="panel">

<h2>⚙️ System Status</h2>

<p>
<b>Mode:</b>
<span id="mode">--</span>
</p>

<p>
<b>Green LED:</b>
<span id="green">--</span>
</p>

<p>
<b>Yellow LED:</b>
<span id="yellow">--</span>
</p>

<p>
<b>Red LED:</b>
<span id="red">--</span>
</p>

<p>
<b>Buzzer:</b>
<span id="buzzer">--</span>
</p>

</div>

</div>


<!-- CONTROLS -->

<div class="controls">

<h2>🎛️ System Control</h2>

<h3>Operating Mode</h3>

<button class="blue"
onclick="setMode('auto')">
AUTO MODE
</button>

<button class="purple"
onclick="setMode('manual')">
MANUAL MODE
</button>


<h3>Status LEDs</h3>

<button class="green"
onclick="control('green','on')">
GREEN ON
</button>

<button class="green"
onclick="control('green','off')">
GREEN OFF
</button>

<br>

<button class="yellow"
onclick="control('yellow','on')">
YELLOW ON
</button>

<button class="yellow"
onclick="control('yellow','off')">
YELLOW OFF
</button>

<br>

<button class="red"
onclick="control('red','on')">
RED ON
</button>

<button class="red"
onclick="control('red','off')">
RED OFF
</button>


<h3>Buzzer</h3>

<button class="green"
onclick="control('buzzer','on')">
BUZZER ON
</button>

<button class="red"
onclick="control('buzzer','off')">
BUZZER OFF
</button>


<h3>Hardware Test</h3>

<button class="purple"
onclick="hardwareTest()">
TEST ALL LEDs + BUZZER
</button>

</div>


<div class="footer">

Smart Grain Storage Monitoring System<br>

ESP32 • IoT • AI/ML Ready

</div>

</div>


<script>

// ==========================================================
// UPDATE DASHBOARD
// ==========================================================

async function updateData()
{

try
{

const response =
await fetch('/data');

const data =
await response.json();


// TEMPERATURE

if(data.temperature !== null)
{

document.getElementById('temp')
.innerText =
data.temperature + " °C";

document.getElementById('tempBar')
.style.width =
Math.min(
data.temperature * 2,
100
) + "%";

}


// HUMIDITY

if(data.humidity !== null)
{

document.getElementById('humidity')
.innerText =
data.humidity + " %";

document.getElementById('humBar')
.style.width =
data.humidity + "%";

}


// GAS

document.getElementById('gas')
.innerText =
data.gasPercent + " %";

document.getElementById('gasBar')
.style.width =
data.gasPercent + "%";


// MOISTURE

document.getElementById('moisture')
.innerText =
data.moisturePercent + " %";

document.getElementById('moistBar')
.style.width =
data.moisturePercent + "%";


// DETAILS

document.getElementById('gasRaw')
.innerText =
data.gasRaw;

document.getElementById('gasDigital')
.innerText =
data.gasDigitalAlarm
? "ALARM"
: "NORMAL";

document.getElementById('moistRaw')
.innerText =
data.moistureRaw;


// SYSTEM

document.getElementById('mode')
.innerText =
data.autoMode
? "AUTO"
: "MANUAL";

document.getElementById('green')
.innerText =
data.greenLED
? "ON"
: "OFF";

document.getElementById('yellow')
.innerText =
data.yellowLED
? "ON"
: "OFF";

document.getElementById('red')
.innerText =
data.redLED
? "ON"
: "OFF";

document.getElementById('buzzer')
.innerText =
data.buzzer
? "ON"
: "OFF";


// STATUS

const status =
document.getElementById('status');

status.innerText =
data.status;

status.className =
"status " +
(data.status === "SENSOR ERROR" ? "critical" : data.status.toLowerCase());


// REASON

document.getElementById('reason')
.innerText =
data.reason;


// RECOMMENDATION

document.getElementById('recommendation')
.innerText =
data.recommendation;

}

catch(error)
{

document.getElementById('status')
.innerText =
"CONNECTION ERROR";

document.getElementById('status')
.className =
"status critical";

}

}


// ==========================================================
// DEVICE CONTROL
// ==========================================================

async function control(device,state)
{

try
{

const response =
await fetch(
'/control?device=' +
device +
'&state=' +
state
);

if(!response.ok)
{
alert("Control failed");
return;
}

updateData();

}

catch(error)
{

alert("ESP32 connection failed");

}

}


// ==========================================================
// MODE
// ==========================================================

async function setMode(mode)
{

try
{

const response =
await fetch(
'/mode?value=' +
mode
);

if(!response.ok)
{
alert("Mode change failed");
return;
}

updateData();

}

catch(error)
{

alert("ESP32 connection failed");

}

}


// ==========================================================
// HARDWARE TEST
// ==========================================================

async function hardwareTest()
{

try
{

const response =
await fetch('/test');

if(response.ok)
{
alert(
"Hardware test completed!"
);

updateData();
}

}

catch(error)
{

alert(
"Hardware test failed"
);

}

}


// ==========================================================
// START
// ==========================================================

updateData();

setInterval(
updateData,
2000
);

</script>

</body>

</html>
)rawliteral";

  addCORS();

  server.send(
    200,
    "text/html; charset=UTF-8",
    html
  );
}

// ============================================================
// JSON API
// ============================================================

String jsonEscape(String value)
{
  value.replace("\\", "\\\\");
  value.replace("\"", "\\\"");
  value.replace("\n", "\\n");
  value.replace("\r", "\\r");
  value.replace("\t", "\\t");
  return value;
}


// ============================================================
// OPTIONAL GOOGLE SHEETS LOGGER (separate from existing routes)
// ============================================================
void logToGoogleSheets()
{
  if (WiFi.status() != WL_CONNECTED) return;
  if (String(GOOGLE_SHEETS_WEB_APP_URL).startsWith("PASTE_")) return;

  WiFiClientSecure client;
  client.setInsecure(); // Prototype shortcut; use certificate validation for production.

  HTTPClient https;
  https.setConnectTimeout(2500);
  https.setTimeout(2500);
  https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  if (!https.begin(client, GOOGLE_SHEETS_WEB_APP_URL))
  {
    Serial.println("Sheets logger: HTTPS begin failed");
    return;
  }

  https.addHeader("Content-Type", "application/json");
  String payload = "{";
  payload += "\"secret\":\"" + jsonEscape(String(GOOGLE_SHEETS_SECRET)) + "\",";
  payload += "\"temperature\":" + (isnan(temperature) ? String("null") : String(temperature, 1)) + ",";
  payload += "\"humidity\":" + (isnan(humidity) ? String("null") : String(humidity, 1)) + ",";
  payload += "\"gasRaw\":" + String(gasRaw) + ",";
  payload += "\"gasPercent\":" + String(gasPercent) + ",";
  payload += "\"gasDigitalAlarm\":" + String(gasDigitalAlarm ? "true" : "false") + ",";
  payload += "\"moistureRaw\":" + String(moistureRaw) + ",";
  payload += "\"moisturePercent\":" + String(moisturePercent) + ",";
  payload += "\"status\":\"" + jsonEscape(systemStatus) + "\",";
  payload += "\"reason\":\"" + jsonEscape(getReason()) + "\",";
  payload += "\"recommendation\":\"" + jsonEscape(getRecommendations()) + "\",";
  payload += "\"autoMode\":" + String(autoMode ? "true" : "false");
  payload += "}";

  int httpCode = https.POST(payload);
  if (httpCode > 0)
  {
    Serial.printf("Sheets logger HTTP status: %d\n", httpCode);
    if (httpCode >= 400) Serial.println(https.getString());
  }
  else
  {
    Serial.printf("Sheets logger failed: %s\n", https.errorToString(httpCode).c_str());
  }
  https.end();
}

void handleData()
{
  addCORS();

  String json = "{";

  // Temperature
  json += "\"temperature\":";

  if (isnan(temperature))
    json += "null";
  else
    json += String(temperature, 1);

  json += ",";

  // Humidity
  json += "\"humidity\":";

  if (isnan(humidity))
    json += "null";
  else
    json += String(humidity, 1);

  json += ",";

  // Gas raw
  json += "\"gasRaw\":";
  json += String(gasRaw);

  json += ",";

  // Gas %
  json += "\"gasPercent\":";
  json += String(gasPercent);

  json += ",";

  // Gas digital
  json += "\"gasDigitalAlarm\":";
  json += gasDigitalAlarm ? "true" : "false";

  json += ",";

  // Moisture raw
  json += "\"moistureRaw\":";
  json += String(moistureRaw);

  json += ",";

  // Moisture %
  json += "\"moisturePercent\":";
  json += String(moisturePercent);

  json += ",";

  // Status
  json += "\"status\":\"";
  json += systemStatus;
  json += "\"";

  json += ",";

  // Reason
  json += "\"reason\":\"";

  String reason = jsonEscape(getReason());
  json += reason;

  json += "\"";

  json += ",";

  // Recommendation
  json += "\"recommendation\":\"";

  String recommendation = jsonEscape(getRecommendations());

  json += recommendation;

  json += "\"";

  json += ",";

  // Mode
  json += "\"autoMode\":";
  json += autoMode ? "true" : "false";

  json += ",";

  // LEDs
  json += "\"greenLED\":";
  json += greenLEDState ? "true" : "false";

  json += ",";

  json += "\"yellowLED\":";
  json += yellowLEDState ? "true" : "false";

  json += ",";

  json += "\"redLED\":";
  json += redLEDState ? "true" : "false";

  json += ",";

  // Buzzer
  json += "\"buzzer\":";
  json += buzzerState ? "true" : "false";

  json += "}";

  server.send(
    200,
    "application/json",
    json
  );
}

// ============================================================
// CONTROL API
// ============================================================

void handleControl()
{
  addCORS();

  if (
    !server.hasArg("device") ||
    !server.hasArg("state")
  )
  {
    server.send(
      400,
      "text/plain",
      "Missing parameters"
    );

    return;
  }

  String device =
    server.arg("device");

  String state =
    server.arg("state");

  autoMode = false;

  bool on =
    state == "on";

  if (device == "green")
  {
    setGreenLED(on);
  }

  else if (device == "yellow")
  {
    setYellowLED(on);
  }

  else if (device == "red")
  {
    setRedLED(on);
  }

  else if (device == "buzzer")
  {
    if (on)
      startBuzzer();
    else
      stopBuzzer();
  }

  else
  {
    server.send(
      400,
      "text/plain",
      "Unknown device"
    );

    return;
  }

  server.send(
    200,
    "text/plain",
    "OK"
  );
}

// ============================================================
// MODE API
// ============================================================

void handleMode()
{
  addCORS();

  if (!server.hasArg("value"))
  {
    server.send(
      400,
      "text/plain",
      "Missing mode"
    );

    return;
  }

  String value =
    server.arg("value");

  if (value == "auto")
  {
    autoMode = true;

    updateSystemStatus();
  }

  else if (value == "manual")
  {
    autoMode = false;
  }

  else
  {
    server.send(
      400,
      "text/plain",
      "Invalid mode"
    );

    return;
  }

  server.send(
    200,
    "text/plain",
    "OK"
  );
}

// ============================================================
// HARDWARE TEST
// ============================================================

void handleTest()
{
  addCORS();

  autoMode = false;

  // GREEN
  setGreenLED(true);
  delay(500);
  setGreenLED(false);

  // YELLOW
  setYellowLED(true);
  delay(500);
  setYellowLED(false);

  // RED
  setRedLED(true);
  delay(500);
  setRedLED(false);

  // BUZZER
  startBuzzer();

  unsigned long startTime =
    millis();

  while (
    millis() - startTime < 1500
  )
  {
    updateBuzzer();
    delay(1);
  }

  stopBuzzer();

  server.send(
    200,
    "text/plain",
    "Hardware test completed"
  );
}

// ============================================================
// 404
// ============================================================

void handleNotFound()
{
  server.send(
    404,
    "text/plain",
    "Not Found"
  );
}

// ============================================================
// WIFI
// ============================================================

void connectWiFi()
{
  Serial.println();
  Serial.println("Connecting to WiFi...");

  WiFi.mode(WIFI_STA);

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  int attempts = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    attempts < 30
  )
  {
    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (
    WiFi.status() ==
    WL_CONNECTED
  )
  {
    Serial.println();
    Serial.println("WiFi Connected!");

    Serial.print(
      "ESP32 IP Address: "
    );

    Serial.println(
      WiFi.localIP()
    );
  }
  else
  {
    Serial.println();
    Serial.println(
      "WiFi connection failed!"
    );
  }
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println(
    "======================================"
  );

  Serial.println(
    "     SMART GRAIN STORAGE SYSTEM"
  );

  Serial.println(
    "======================================"
  );

  // LEDs
  pinMode(
    GREEN_LED_PIN,
    OUTPUT
  );

  pinMode(
    YELLOW_LED_PIN,
    OUTPUT
  );

  pinMode(
    RED_LED_PIN,
    OUTPUT
  );

  // Buzzer
  pinMode(
    BUZZER_PIN,
    OUTPUT
  );

  // Onboard LED
  pinMode(
    ONBOARD_LED_PIN,
    OUTPUT
  );

  // MQ135 digital
  pinMode(
    MQ135_DO,
    INPUT
  );

  // Initial outputs
  allLEDsOff();
  stopBuzzer();

  digitalWrite(
    ONBOARD_LED_PIN,
    LOW
  );

  // ADC (ESP32 12-bit range: 0-4095)
  analogReadResolution(12);
  analogSetPinAttenuation(MQ135_AO, ADC_11db);
  analogSetPinAttenuation(MOISTURE_PIN, ADC_11db);

  // DHT
  dht.begin();

  // LCD
  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );

  initializeLCD();

  // WiFi
  connectWiFi();

  // ==========================================================
  // WEB ROUTES
  // ==========================================================

  server.on(
    "/",
    HTTP_GET,
    handleRoot
  );

  server.on(
    "/data",
    HTTP_GET,
    handleData
  );

  server.on(
    "/control",
    HTTP_GET,
    handleControl
  );

  server.on(
    "/mode",
    HTTP_GET,
    handleMode
  );

  server.on(
    "/test",
    HTTP_GET,
    handleTest
  );

  server.onNotFound(
    handleNotFound
  );

  // Start server
  server.begin();

  Serial.println();
  Serial.println(
    "Web server started!"
  );

  if (
    WiFi.status() ==
    WL_CONNECTED
  )
  {
    Serial.print(
      "Open: http://"
    );

    Serial.println(
      WiFi.localIP()
    );
  }

  Serial.println();
  Serial.println(
    "System Ready!"
  );
}

// ============================================================
// LOOP
// ============================================================

void loop()
{
  // Web server
  server.handleClient();

  // Buzzer
  updateBuzzer();

  // Sensor reading
  if (
    millis() -
    lastSensorRead >=
    SENSOR_INTERVAL
  )
  {
    lastSensorRead =
      millis();

    readSensors();

    updateSystemStatus();
  }

  // LCD
  updateLCD();

  // Optional cloud logging, isolated from existing sensor/dashboard logic.
  if (millis() - lastGoogleSheetsLog >= GOOGLE_SHEETS_LOG_INTERVAL)
  {
    lastGoogleSheetsLog = millis();
    logToGoogleSheets();
  }
}