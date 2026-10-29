/*
  IoT Smart Obstacle Avoiding Robot — Arduino UNO Controller
  Hardware: Arduino UNO + Adafruit Motor Shield V1 (L293D) + HC-SR04 + SG90
  Telemetry: sends a line over UNO TX (D1) for the ESP32 to forward to cloud.
*/

#include <AFMotor.h>
#include <NewPing.h>
#include <Servo.h>

// The Motor Shield V1 uses most digital pins; use analog pins as digital I/O.
const byte TRIG_PIN = A0;
const byte ECHO_PIN = A1;
const byte SERVO_PIN = 10;       // Servo port/pin 10 on Motor Shield V1
const int MAX_DISTANCE_CM = 200;
const int SAFE_DISTANCE_CM = 30;
const int MOTOR_SPEED = 170;     // 0–255; tune for your chassis

NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DISTANCE_CM);
Servo scanServo;
AF_DCMotor motorFL(1), motorRL(2), motorFR(3), motorRR(4);

int lastFront = 0;
int lastLeft = 0;
int lastRight = 0;

int readDistanceCm() {
  delay(40);                     // prevents ultrasonic echo overlap
  unsigned int cm = sonar.ping_cm();
  return (cm == 0) ? MAX_DISTANCE_CM : cm; // no echo = clear beyond range
}

void setAllSpeed(int speedValue) {
  motorFL.setSpeed(speedValue); motorRL.setSpeed(speedValue);
  motorFR.setSpeed(speedValue); motorRR.setSpeed(speedValue);
}

void releaseAll() {
  motorFL.run(RELEASE); motorRL.run(RELEASE);
  motorFR.run(RELEASE); motorRR.run(RELEASE);
}

void moveForward() {
  motorFL.run(FORWARD); motorRL.run(FORWARD);
  motorFR.run(FORWARD); motorRR.run(FORWARD);
}

void moveBackward() {
  motorFL.run(BACKWARD); motorRL.run(BACKWARD);
  motorFR.run(BACKWARD); motorRR.run(BACKWARD);
}

void turnLeft() {
  motorFL.run(BACKWARD); motorRL.run(BACKWARD);
  motorFR.run(FORWARD);  motorRR.run(FORWARD);
}

void turnRight() {
  motorFL.run(FORWARD);  motorRL.run(FORWARD);
  motorFR.run(BACKWARD); motorRR.run(BACKWARD);
}

int lookAt(byte angle) {
  scanServo.write(angle);
  delay(450);                    // allow the servo to settle
  return readDistanceCm();
}

void sendTelemetry(const char* state) {
  // ESP32 reads this line through a level-shifted serial connection.
  Serial.print("distance="); Serial.print(lastFront);
  Serial.print(";left="); Serial.print(lastLeft);
  Serial.print(";right="); Serial.print(lastRight);
  Serial.print(";state="); Serial.println(state);
}

void setup() {
  Serial.begin(9600);
  setAllSpeed(MOTOR_SPEED);
  scanServo.attach(SERVO_PIN);
  scanServo.write(90);
  delay(800);
  releaseAll();
  sendTelemetry("ready");
}

void loop() {
  lastFront = readDistanceCm();

  if (lastFront > SAFE_DISTANCE_CM) {
    lastLeft = 0;
    lastRight = 0;
    moveForward();
    sendTelemetry("moving_forward");
    delay(120);
    return;
  }

  releaseAll();
  sendTelemetry("obstacle_detected");
  delay(250);

  moveBackward();
  delay(350);
  releaseAll();
  delay(150);

  lastRight = lookAt(25);
  lastLeft = lookAt(155);
  scanServo.write(90);
  delay(300);

  if (lastLeft >= lastRight) {
    sendTelemetry("turning_left");
    turnLeft();
  } else {
    sendTelemetry("turning_right");
    turnRight();
  }
  delay(480);                    // tune for a 45–90° turn on your floor
  releaseAll();
  sendTelemetry("turn_complete");
}