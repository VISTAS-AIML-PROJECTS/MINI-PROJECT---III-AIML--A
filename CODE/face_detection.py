import cv2
import os

# Get the project folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# YuNet model path
MODEL = os.path.join(
    BASE_DIR,
    "models",
    "face_detection_yunet_2023mar.onnx"
)

# Check whether model exists
if not os.path.exists(MODEL):
    print("ERROR: YuNet model not found!")
    print("Expected location:")
    print(MODEL)
    exit()

print("YuNet model found:")
print(MODEL)


# Create YuNet face detector
detector = cv2.FaceDetectorYN_create(
    MODEL,
    "",
    (640, 480),
    0.6,
    0.3,
    5000
)

print("YuNet face detector created successfully.")


# Open laptop webcam
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("ERROR: Could not open webcam.")
    exit()

print("Webcam opened successfully.")
print("Press Q to quit.")



# Start webcam loop
while True:
    ret, frame = camera.read()

    if not ret:
        print("ERROR: Could not read webcam frame.")
        break

    # Set detector input size to webcam frame size
    detector.setInputSize((frame.shape[1], frame.shape[0]))

    # Detect faces
    _, faces = detector.detect(frame)

    # Draw rectangles around detected faces
    if faces is not None:
        for face in faces:
            x, y, w, h = face[:4].astype(int)

            confidence = face[-1]

            if confidence < 0.60:
                continue
            x = max(0, x)
            y = max(0, y)
            w = min(w, frame.shape[1] - x)
            h = min(h, frame.shape[0] - y)

            # Crop the detected face
            face_crop = frame[y:y+h, x:x+w]

            # Check that the crop is valid
            if face_crop.size == 0:
                continue

            # Resize face for CNN
            face_resized = cv2.resize(face_crop, (128, 128))

            # Normalize pixel values from 0-255 to 0-1
            face_normalized = face_resized.astype("float32") / 255.0

            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                2
            )
            cv2.putText(
                frame,
                f"FACE DETECTED: {confidence:.2f}",
                (x,y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0,255,0),
                2

            )

    # Display webcam
    cv2.imshow("Laboratory CCTV - Face Detection", frame)

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Release webcam
camera.release()
cv2.destroyAllWindows()