import cv2
import time

print("Opening Windows camera...")

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("CAMERA OPEN FAILED")
    raise SystemExit(1)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("CAMERA OPENED")
print("Waiting for frame...")

for i in range(100):
    ok, frame = cap.read()

    if ok and frame is not None:
        print("FRAME RECEIVED:", frame.shape)
        cv2.imwrite("camera_test.jpg", frame)
        print("SAVED: camera_test.jpg")
        break

    print("No frame:", i)
    time.sleep(0.05)
else:
    print("CAMERA FRAME FAILED")

cap.release()
print("DONE")
