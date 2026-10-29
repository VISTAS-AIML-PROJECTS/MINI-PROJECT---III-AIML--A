"""
Runs on the Raspberry Pi INSIDE EACH BUS (one copy per bus).
Takes a photo every CAPTURE_INTERVAL seconds, counts people with YOLO, works out
LOW / MEDIUM / HIGH and sends only that level to the central server.

    pip install ultralytics opencv-python requests      (+ picamera2 for Pi Camera Module)
    python3 bus_client.py
"""
import time

import cv2
import numpy as np
import requests
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# SET THESE FOR EACH BUS
# ---------------------------------------------------------------------------
BUS_ID = "TN01N1234"                             # unique per vehicle (e.g. its registration number)
ROUTE_NO = "21G"                                 # the Chennai route this bus is running today
SERVER_URL = "http://192.168.1.10:5000"          # address of the machine running server.py
API_KEY = "change-me"                            # same as BUS_API_KEY on the server

USE_PICAMERA2 = False        # True = Pi Camera Module (ribbon cable)
CAMERA_INDEX = 0             # USB webcam: 0 is usually right (check: ls /dev/video*)

SEATING_CAPACITY = 40
STANDING_CAPACITY = 30
DETECTION_CORRECTION = 1.0   # see earlier note: >1 if the camera misses people
CAPTURE_INTERVAL = 10        # seconds between photos
# ---------------------------------------------------------------------------
MODEL_PATH = "yolov8n.pt"
CONF_THRESHOLD = 0.4
PERSON_CLASS_ID = 0
WARMUP_FRAMES = 5
FRAME_WIDTH, FRAME_HEIGHT = 640, 480
ROI_POLYGON = None

LOW_MAX = round(SEATING_CAPACITY * 0.75)
MEDIUM_MAX = SEATING_CAPACITY + round(STANDING_CAPACITY * 0.5)

model = YOLO(MODEL_PATH)


def classify_level(count):
    if count <= LOW_MAX:
        return "LOW"
    if count <= MEDIUM_MAX:
        return "MEDIUM"
    return "HIGH"


def in_roi(point):
    if not ROI_POLYGON:
        return True
    return cv2.pointPolygonTest(np.array(ROI_POLYGON, dtype=np.int32), point, False) >= 0


def capture_photo():
    if USE_PICAMERA2:
        from picamera2 import Picamera2
        cam = Picamera2()
        try:
            cam.configure(cam.create_still_configuration(
                main={"size": (FRAME_WIDTH, FRAME_HEIGHT), "format": "RGB888"}))
            cam.start()
            time.sleep(0.5)
            return cam.capture_array()
        finally:
            cam.stop()
            cam.close()
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
    try:
        frame = None
        for _ in range(WARMUP_FRAMES):
            ok, f = cap.read()
            if ok:
                frame = f
        return frame
    finally:
        cap.release()


def count_people(frame):
    res = model(frame, conf=CONF_THRESHOLD, classes=[PERSON_CLASS_ID], verbose=False)[0]
    n = 0
    for box in res.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        if in_roi(((x1 + x2) / 2, (y1 + y2) / 2)):
            n += 1
    return n


def send(level):
    r = requests.post(f"{SERVER_URL}/api/report",
                      json={"bus_id": BUS_ID, "route": ROUTE_NO, "level": level},
                      headers={"X-API-Key": API_KEY}, timeout=5)
    r.raise_for_status()


while True:
    started = time.time()
    try:
        frame = capture_photo()
        if frame is None:
            raise RuntimeError("camera returned no frame")
        raw = count_people(frame)
        count = round(raw * DETECTION_CORRECTION)
        level = classify_level(count)
        print(f"[{time.strftime('%H:%M:%S')}] detected={raw} estimated={count} -> {level}")
        send(level)
    except requests.RequestException as e:
        print("Could not reach server (will retry next cycle):", e)
    except Exception as e:
        print("Capture failed:", e)
    time.sleep(max(1.0, CAPTURE_INTERVAL - (time.time() - started)))
