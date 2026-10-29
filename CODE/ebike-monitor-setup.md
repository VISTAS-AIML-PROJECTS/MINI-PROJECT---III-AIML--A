# E-Bike Smart Monitor — hardware and setup

ESP32 monitoring module for the AI-Powered Multi-Brand E-Bike Recommendation and Smart Monitoring System. Data goes to Supabase project `juhygjhhoittuegzotud`; alerts go to Telegram.

## Wiring

| Module | Pin | ESP32 |
|---|---|---|
| DS18B20 x2 (one bus) | DATA | GPIO4, with 4.7 kΩ to 3V3 |
| MPU6050, BMP280, OLED, INA219 (I²C) | SDA / SCL | GPIO21 / GPIO22 |
| MPU6050, BMP280, OLED, INA219 | VCC / GND | 3V3 / GND |
| NEO-6M GPS | TX | GPIO16 (ESP32 RX2) |
| NEO-6M GPS | RX | GPIO17 (ESP32 TX2) |
| NEO-6M GPS | VCC / GND | VIN (5 V) / GND |
| INA219 | VIN+ | Supply + |
| INA219 | VIN− | Load + |
| Buzzer | + | GPIO5 |
| Red LED / Green LED | anode (via 220 Ω) | GPIO25 / GPIO26 |

INA219: the supply's negative must share GND with the ESP32, and VIN± must stay under 26 V. GPIO16/17 are free on a DevKit V1 (WROOM-32); on a WROVER board they are used by PSRAM, so pick other pins.

I²C addresses: OLED 0x3C, MPU6050 0x68, BMP280 0x76, INA219 0x40.

## Libraries

OneWire, DallasTemperature, Adafruit BMP280, Adafruit SSD1306, Adafruit Unified Sensor, Adafruit INA219, TinyGPSPlus, ArduinoJson.

## One-time setup

1. Supabase → SQL Editor → run add_gps_power.sql (adds the GPS and power columns).
2. In the sketch, set WIFI_SSID and WIFI_PASS. Supabase and Telegram are already filled in.
3. Upload, open Serial Monitor at 115200. The boot log lists every module found on the I²C bus and whether the GPS is sending data.

## How it behaves

- A module that does not answer has its features switched off, not faked. It is retried every 10 s and Telegram reports when it drops out or comes back.
- Voltage limits are relative to the supply seen at boot: warning below 85 %, critical below 75 %. Works for a 5 V USB supply, a 9 V battery or a 12 V pack. Unplugging the supply forgets it; the next one is learned fresh. Set VOLT_NOMINAL to fix a value instead.
- Current: warning above 2 A, critical above 3 A.
- Overspeed warning above 25 km/h (Indian low-speed e-bike limit), only on a good GPS fix.
- Theft: while parked, movement detected by the MPU6050 or a move of more than 50 m by GPS raises a critical alert. Theft and impact alerts include a Google Maps link.
- If the Supabase table is missing the new columns, the firmware falls back to the original fields and sends a Telegram notice, instead of losing every upload.

## GPS notes

The NEO-6M needs open sky. A cold start takes 1–5 minutes; indoors it usually never gets a fix. The dashboard then shows "SEARCHING" with satellites in view and the last known position. Get a fix outdoors before a demo.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| I²C scan shows only 0x3C | Sensor power or SDA/SCL wiring; check breadboard rails split in the middle |
| NEO-6M "NOT DETECTED" | GPS TX not on GPIO16, or no power to the module |
| NEO-6M "no valid sentences" | Baud rate wrong; GPS_BAUD is 9600 |
| Random resets during upload | Add 470 µF across 5 V and GND |
| Telegram silent | Message the bot once from your phone first |
