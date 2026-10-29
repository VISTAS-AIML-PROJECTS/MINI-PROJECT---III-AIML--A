# IoT-Based Smart Obstacle-Avoiding Robot

An Arduino-based four-wheel robot that detects obstacles with an
ultrasonic sensor and autonomously changes direction to avoid them. The
project is designed as a low-cost robotics platform, with an ESP32-based
IoT monitoring extension where implemented.

> **Project status:** The supplied Arduino sketch implements local
> obstacle avoidance. Only describe ESP32/cloud monitoring as completed
> if the hardware, firmware, and dashboard have been tested.

## Overview

The robot uses an HC-SR04 ultrasonic sensor mounted on an SG90 servo. An
Arduino UNO controls four DC geared motors through an Adafruit Motor
Shield V1-compatible board. When an obstacle is detected within the
configured threshold, the robot stops, reverses briefly, scans left and
right, and turns toward the direction with more measured clearance.

## Features

-   Four-wheel movement using DC geared motors.
-   HC-SR04 ultrasonic obstacle detection.
-   Servo-based left/right scanning.
-   Automatic direction selection based on measured distance.
-   Adjustable threshold and motor speed in the Arduino sketch.
-   Serial distance output.
-   Optional ESP32/Wi-Fi telemetry extension, if implemented.

## Hardware Requirements

  Component                                                 Quantity Purpose
  ------------------------------------------- ---------------------- ------------------------
  Arduino UNO                                                      1 Main controller
  Adafruit Motor Shield V1-compatible board                        1 Controls four motors
  DC geared motors                                                 4 Movement
  Robot wheels                                                     4 Locomotion
  HC-SR04 ultrasonic sensor                                        1 Distance measurement
  SG90 servo motor                                                 1 Sensor scanning
  Robot chassis                                                    1 Holds components
  Suitable battery pack and holder                                 1 Power supply
  ON/OFF switch                                                    1 Power control
  Jumper wires and mounting materials                      As needed Connections
  ESP32 development board                       1, for IoT extension Wi-Fi telemetry
  Suitable regulators/converters                           As needed Compatible power rails

**Library note:** The supplied sketch uses `AFMotor.h`, associated with
the older Adafruit Motor Shield V1 library. Do not substitute the
Adafruit Motor Shield V2 library without adapting the code.

## Software Requirements

-   [Arduino IDE](https://www.arduino.cc/en/software)
-   AFMotor library compatible with Motor Shield V1
-   NewPing library
-   Servo library, normally included with the Arduino AVR core

Install the required libraries using the Arduino IDE Library Manager and
confirm compatibility with your board and shield.

## Wiring Reference

The following assignments come from the supplied Arduino sketch. Verify
physical wiring before powering the robot.

  Component / Signal   Arduino connection
  -------------------- -------------------------
  HC-SR04 TRIG         A1
  HC-SR04 ECHO         A0
  Servo signal         D9
  Motor 1              Motor Shield channel M1
  Motor 2              Motor Shield channel M2
  Motor 3              Motor Shield channel M3
  Motor 4              Motor Shield channel M4

Connect sensor power and ground appropriately. Actual motor and servo
power connections depend on the hardware configuration.

### Power and electrical compatibility

-   Check the voltage and current requirements of the motors, servo,
    Arduino, and ESP32.
-   Never power motors directly from Arduino GPIO pins.
-   Use a suitable power supply and correctly rated regulator.
-   Connect grounds appropriately when separate supplies are used.
-   ESP32 GPIO uses 3.3 V logic. Do not connect a 5 V Arduino TX signal
    directly to an ESP32 RX pin; use a suitable level shifter or voltage
    divider.
-   Verify polarity and converter outputs with a multimeter before
    connecting boards.

## How It Works

1.  The Arduino initializes the four motors at speed `200`.
2.  The servo points the sensor to approximately `100°`.
3.  The ultrasonic sensor measures the distance ahead.
4.  If the distance is greater than `15 cm`, the robot moves forward.
5.  If an obstacle is detected within `15 cm`, the robot stops and
    reverses briefly.
6.  The servo scans right to approximately `30°` and measures the
    distance.
7.  It scans left to approximately `170°` and measures again.
8.  The robot turns toward the direction with the greater measured
    clearance.
9.  The cycle repeats.

The sketch treats a zero reading from NewPing as `250 cm`. This is a
software fallback value, not a verified physical measurement.

## Setup and Upload

1.  Assemble the chassis, motors, motor shield, ultrasonic sensor, and
    servo.
2.  Check motor channel mapping and connections.
3.  Connect HC-SR04 TRIG to A1 and ECHO to A0.
4.  Connect the servo signal to D9, as defined in the sketch.
5.  Check power wiring, polarity, and voltage compatibility.
6.  Install the compatible AFMotor and NewPing libraries.
7.  Open the `.ino` sketch in Arduino IDE.
8.  Connect the UNO by USB.
9.  Select **Tools → Board → Arduino UNO** and the correct serial port.
10. Click **Verify**, then **Upload**.
11. Open Serial Monitor at **9600 baud** to view distance readings.
12. Test motor direction with the wheels lifted before placing the robot
    on a clear, level surface.

If `AFMotor.h` cannot be found, verify that the Motor Shield
V1-compatible library is installed.

## Testing and Evaluation

Use a controlled indoor environment and record real measurements.

  -----------------------------------------------------------------------
  Test                    Procedure               Record
  ----------------------- ----------------------- -----------------------
  Distance accuracy       Place a target at       Reference distance,
                          measured distances      sensor reading, error

  Obstacle detection      Place obstacles at      Detection outcome and
                          different distances     response

  Avoidance performance   Repeat approaches to    Successful avoidance,
                          obstacles               collision, failure

  Direction selection     Leave more space on one Selected direction and
                          side                    correctness

  Servo scan              Observe both scan       Angle and repeatability
                          positions               

  Motor movement          Check forward, reverse, Direction, timing,
                          and turning             wheel consistency

  Runtime                 Run for a defined       Runtime, resets,
                          supervised interval     overheating, failures
  -----------------------------------------------------------------------

Useful metrics:

-   **Absolute distance error:**
    `|measured distance − reference distance|`
-   **Avoidance success rate:**
    `(successful avoidance trials / total valid trials) × 100%`
-   **Collision rate:**
    `(trials with collision / total valid trials) × 100%`
-   **Mean response time:** average time between a defined detection
    event and the observed response.

Do not report numerical results until measurements have been collected.
Include the test conditions and number of trials.

## IoT Extension

The proposed extension uses an ESP32 to send telemetry over Wi-Fi to a
monitoring service such as ThingSpeak. Document it as implemented only
after verifying:

-   Arduino-to-ESP32 communication.
-   Matching baud rate, UART pins, and message format.
-   Safe voltage levels.
-   Wi-Fi and cloud configuration.
-   Correct channel-field mapping and update interval.
-   Dashboard status and controls.
-   Emergency Stop behaviour.

Do not commit Wi-Fi passwords, API keys, or cloud write keys. Keep
credentials in a local configuration file excluded from version control.

## Suggested Repository Structure

``` text
iot-smart-obstacle-avoiding-robot/
├── README.md
├── firmware/
│   └── obstacle_avoiding_robot/
│       └── obstacle_avoiding_robot.ino
├── esp32/                    # If ESP32 firmware is included
├── diagrams/
│   ├── system_architecture.png
│   └── wiring_diagram.png
├── images/
│   └── robot_prototype.jpg
├── test-data/
│   └── README.md
├── docs/
│   └── project_report.pdf
└── .gitignore
```

Adjust this structure to match files actually committed to the
repository. Do not link to files that are not present.

## Troubleshooting

  -----------------------------------------------------------------------
  Problem                             Possible checks
  ----------------------------------- -----------------------------------
  `AFMotor.h` missing                 Install the compatible Motor Shield
                                      V1 library

  `NewPing.h` missing                 Install NewPing

  Board or serial port unavailable    Check USB cable, board selection,
                                      port, and driver if required

  Motors turn incorrectly             Switch off power and inspect wiring
                                      and channel mapping

  Servo does not move                 Check signal pin, power, ground,
                                      and mechanical obstruction

  Sensor readings are unstable        Check TRIG/ECHO wiring, sensor
                                      alignment, target surface, and
                                      power

  Arduino resets when motors start    Check battery capability, current
                                      demand, power distribution, and
                                      grounding

  ESP32 receives no serial data       Check UART pins, baud rate, common
                                      ground, message format, and logic
                                      levels

  Cloud data does not update          Check Wi-Fi, credentials, API key,
                                      field mapping, and service limits
  -----------------------------------------------------------------------

## Safety Notes

-   Keep fingers, loose wires, and objects away from moving wheels.
-   Lift the wheels during initial motor-direction tests.
-   Switch off power before changing wiring.
-   Avoid short circuits and reverse polarity.
-   Supervise floor tests and provide enough clear space.
-   Treat Emergency Stop as verified only after testing it physically.

## Future Improvements

-   Collect repeatable distance and navigation test data.
-   Add wheel encoders and battery-voltage monitoring.
-   Improve turning calibration and sensor filtering.
-   Add documented IoT telemetry history and remote control.
-   Test on different floor surfaces and obstacle types.
-   Implement safe handling for Wi-Fi loss and remote-command failure.

## Contributing

Document hardware changes, pin assignments, library requirements, test
conditions, and measured performance. Keep credentials out of source
control and test changes safely before floor operation.

## License

Choose and add a license before publishing the repository. Follow your
institution's rules for sharing coursework and third-party libraries.
