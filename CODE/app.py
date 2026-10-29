import time
import threading
import cv2
import numpy as np
from flask import Flask, Response, render_template, jsonify,request
import requests
from ultralytics import YOLO

MODEL_PATH = "yolov8n.pt"
CONF_THRESHOLD = 0.4
PERSON_CLASS_ID = 0

LOW_MAX = 5
MEDIUM_MAX = 12

FRAME_WIDTH = 480
FRAME_HEIGHT = 360
PROCESS_EVERY_N_FRAMES = 3

ROI_POLYGON = None

USE_PICAMERA2 = False
CAMERA_INDEX = 0

app = Flask(__name__)

model = YOLO(MODEL_PATH)

state_lock = threading.Lock()

latest_frame_jpeg = None
latest_status = {
    "count": 0,
    "level": "LOW",
    "timestamp": None
}


def classify_level(count):
    if count <= LOW_MAX:
        return "LOW"
    elif count <= MEDIUM_MAX:
        return "MEDIUM"
    else:
        return "HIGH"


def point_in_polygon(point, polygon):
    if not polygon:
        return True

    contour = np.array(polygon, dtype=np.int32)

    return cv2.pointPolygonTest(
        contour, point, False
    ) >= 0


def count_people(frame):

    results = model(
        frame,
        conf=CONF_THRESHOLD,
        classes=[PERSON_CLASS_ID],
        verbose=False
    )[0]

    count = 0

    for box in results.boxes:

        x1, y1, x2, y2 = box.xyxy[0].tolist()

        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2

        if point_in_polygon((cx, cy), ROI_POLYGON):

            count += 1

            cv2.rectangle(
                frame,
                (int(x1), int(y1)),
                (int(x2), int(y2)),
                (0, 255, 0),
                2
            )

    level = classify_level(count)

    cv2.putText(
        frame,
        f"Count: {count}  Level: {level}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 255),
        2
    )

    return frame, count, level

def get_camera():
    cap = cv2.VideoCapture("http://172.31.99.151:8080/video")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    return cap



def capture_loop():

    global latest_frame_jpeg
    global latest_status

    cam = get_camera()

    frame_idx = 0

    last_annotated = None

    while True:

        ok, frame = cam.read()

        if not ok:
            time.sleep(0.5)
            continue

        frame_idx += 1

        if (
            frame_idx % PROCESS_EVERY_N_FRAMES == 0
            or last_annotated is None
        ):

            annotated, count, level = count_people(frame)

            last_annotated = annotated

            with state_lock:

                latest_status = {
                    "count": count,
                    "level": level,
                    "timestamp":
                        time.strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                }
            try:
                requests.post(
                    "http://127.0.0.1:5001/api/report",
                    headers={"X-API-Key": "change-me"},
                    json={
                        "bus_id": "BUS001",
                        "route": "21G",
                        "level": level
                    },
                    timeout=2
                )
            except requests.RequestException as e:
                print("Bus report failed:", e)
        else:

            annotated = frame

        ok, buf = cv2.imencode(
            ".jpg",
            annotated
        )

        if ok:

            with state_lock:

                latest_frame_jpeg = buf.tobytes()


def mjpeg_generator():

    while True:

        with state_lock:

            frame = latest_frame_jpeg

        if frame is not None:

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + frame +
                b"\r\n"
            )

        time.sleep(0.05)


@app.route("/")
def index():

    return render_template("index.html")


@app.route("/video_feed")
def video_feed():

    return Response(
        mjpeg_generator(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/status")
def status():

    with state_lock:

        return jsonify(latest_status)
@app.route("/api/buses")
def get_buses():
    try:
        response = requests.get(
            "http://127.0.0.1:5001/api/buses",
            timeout=3
        )
        return jsonify(response.json()), response.status_code
    except requests.RequestException:
        return jsonify({"error": "Bus server unavailable"}), 503


@app.route("/api/routes")
def get_routes():
    try:
        query = request.args.get("q", "")
        response = requests.get(
            "http://127.0.0.1:5001/api/routes",
            params={"q": query},
            timeout=3
        )
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        print("Route search failed:", e)
        return jsonify([])

@app.route("/api/history/<bus_id>")
def get_bus_history(bus_id):
    try:
        response = requests.get(
            f"http://127.0.0.1:5001/api/history/{bus_id}",
            timeout=3
        )
        return jsonify(response.json()), response.status_code
    except requests.RequestException:
        return jsonify([])

if __name__ == "__main__":

    t = threading.Thread(
        target=capture_loop,
        daemon=True
    )

    t.start()

    app.run(
        host="0.0.0.0",
        port=5000,
        threaded=True
    )