import os
import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image


# ============================================================
# LABORATORY CCTV
# YuNet Face Detection + ResNet18 Occlusion Classification
# ============================================================


print("=" * 65)
print("LABORATORY CCTV - FACE DETECTION + OCCLUSION CLASSIFICATION")
print("=" * 65)


# ------------------------------------------------------------
# PROJECT PATH
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)


# ------------------------------------------------------------
# MODEL PATHS
# ------------------------------------------------------------

YUNET_MODEL = os.path.join(
    BASE_DIR,
    "models",
    "face_detection_yunet_2023mar.onnx"
)

CLASSIFIER_MODEL = os.path.join(
    BASE_DIR,
    "models",
    "facial_occlusion_resnet18_v2.pth"
)


# ------------------------------------------------------------
# CHECK MODEL FILES
# ------------------------------------------------------------

if not os.path.exists(YUNET_MODEL):
    print("\nERROR: YuNet model not found!")
    print("Expected:")
    print(YUNET_MODEL)
    raise SystemExit


if not os.path.exists(CLASSIFIER_MODEL):
    print("\nECLASSIFIER_MODELRROR: ResNet18 model not found!")
    print("Expected:")
    print(CLASSIFIER_MODEL)
    raise SystemExit


print("\nYuNet model found:")
print(YUNET_MODEL)

print("\nResNet18 model found:")
print(CLASSIFIER_MODEL)


# ------------------------------------------------------------
# DEVICE
# ------------------------------------------------------------

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print(f"\nDevice: {device}")


# ------------------------------------------------------------
# CLASS NAMES
# ------------------------------------------------------------

class_names = [
    "FULLY VISIBLE",
    "PPE COMPLIANT",
    "UNAUTHORIZED OCCLUSION"
]


# ------------------------------------------------------------
# LOAD RESNET18
# ------------------------------------------------------------

print("\nLoading ResNet18 classifier...")

classifier = models.resnet18(weights=None)

classifier.fc = nn.Linear(
    classifier.fc.in_features,
    len(class_names)
)


checkpoint = torch.load(
    CLASSIFIER_MODEL,
    map_location=device
)


# Support both normal state_dict and checkpoint format
if (
    isinstance(checkpoint, dict)
    and "model_state_dict" in checkpoint
):
    classifier.load_state_dict(
        checkpoint["model_state_dict"]
    )
else:
    classifier.load_state_dict(checkpoint)


classifier = classifier.to(device)
classifier.eval()

print("ResNet18 classifier loaded successfully.")


# ------------------------------------------------------------
# RESNET18 PREPROCESSING
# IMPORTANT:
# This must match the preprocessing used during training.
# ------------------------------------------------------------

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ------------------------------------------------------------
# CREATE YUNET FACE DETECTOR
# ------------------------------------------------------------

print("\nLoading YuNet face detector...")

detector = cv2.FaceDetectorYN_create(
    YUNET_MODEL,
    "",
    (640, 480),
    0.6,
    0.3,
    5000
)

print("YuNet face detector created successfully.")


# ------------------------------------------------------------
# OPEN WEBCAM
# ------------------------------------------------------------

print("\nOpening webcam...")

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("ERROR: Could not open webcam.")
    raise SystemExit


# Webcam resolution
camera.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    1280
)

camera.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    720
)


print("Webcam opened successfully.")
print("\nPress Q to quit.")
print("=" * 65)

# ------------------------------------------------------------
# CREATE LARGE CCTV DISPLAY WINDOW
# ------------------------------------------------------------

window_name = "Laboratory CCTV - Facial Occlusion Monitor"

cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

# Approximately 75% screen size
cv2.resizeWindow(window_name, 1200, 675)

# ------------------------------------------------------------
# WEBCAM LOOP
# ------------------------------------------------------------

while True:

    ret, frame = camera.read()

    if not ret:
        print("ERROR: Could not read webcam frame.")
        break


    # --------------------------------------------------------
    # Set YuNet input size
    # --------------------------------------------------------

    detector.setInputSize(
        (
            frame.shape[1],
            frame.shape[0]
        )
    )


    # --------------------------------------------------------
    # Detect faces
    # --------------------------------------------------------

    _, faces = detector.detect(frame)


    # --------------------------------------------------------
    # Process detected faces
    # --------------------------------------------------------

    if faces is not None:

        for face in faces:

            # ------------------------------------------------
            # Get bounding box
            # ------------------------------------------------

            x, y, w, h = face[:4].astype(int)

            detection_confidence = float(face[-1])


            # ------------------------------------------------
            # Ignore weak detections
            # ------------------------------------------------

            if detection_confidence < 0.60:
                continue


            # ------------------------------------------------
            # Keep bounding box inside frame
            # ------------------------------------------------

            x = max(0, x)
            y = max(0, y)

            w = min(
                w,
                frame.shape[1] - x
            )

            h = min(
                h,
                frame.shape[0] - y
            )


            # ------------------------------------------------
            # Check valid bounding box
            # ------------------------------------------------

            if w <= 0 or h <= 0:
                continue


            # ------------------------------------------------
            # Crop face
            # ------------------------------------------------

            # ------------------------------------------------
# Expand face region
# This gives the classifier more context so it can
# see laboratory PPE such as goggles and face masks.
# ------------------------------------------------

            expand_x = int(w * 0.45)
            expand_top = int(h * 0.30)
            expand_bottom = int(h * 0.65)

            crop_x1 = max(0, x - expand_x)
            crop_y1 = max(0, y - expand_top)

            crop_x2 = min(
                frame.shape[1],
                x + w + expand_x
            )

            crop_y2 = min(
    frame.shape[0],
    y + h + expand_bottom
)

            face_crop = frame[
                crop_y1:crop_y2,
                crop_x1:crop_x2
            ]


            if face_crop.size == 0:
                continue


            # ------------------------------------------------
            # OpenCV BGR -> RGB
            # ------------------------------------------------

            face_rgb = cv2.cvtColor(
                face_crop,
                cv2.COLOR_BGR2RGB
            )


            # ------------------------------------------------
            # Convert to PIL image
            # ------------------------------------------------

            face_pil = Image.fromarray(
                face_rgb
            )


            # ------------------------------------------------
            # Apply ResNet18 preprocessing
            # ------------------------------------------------

            input_tensor = transform(
                face_pil
            )


            # Add batch dimension
            input_tensor = input_tensor.unsqueeze(0)

            input_tensor = input_tensor.to(device)


            # ------------------------------------------------
            # ResNet18 prediction
            # ------------------------------------------------

            with torch.no_grad():

                output = classifier(
                    input_tensor
                )

                probabilities = torch.softmax(output, dim=1)

                # Smooth predictions across frames for a steadier demo
                current_probs = probabilities[0].detach()

                if not hasattr(classifier, "_smoothed_probs"):
                    classifier._smoothed_probs = current_probs.clone()
                else:
                    classifier._smoothed_probs = (
                        0.4 * classifier._smoothed_probs
                        + 0.6 * current_probs
                    )

                smoothed = classifier._smoothed_probs.unsqueeze(0)

                confidence, prediction = torch.max(smoothed, dim=1)

                if not hasattr(classifier, "_debug_count"):
                    classifier._debug_count = 0

                classifier._debug_count += 1

                if classifier._debug_count % 30 == 0:
                    probs = probabilities[0].cpu().tolist()
                    print(
                        f"Fully Visible: {probs[0]:.3f} | "
                        f"PPE Compliant: {probs[1]:.3f} | "
                        f"Unauthorized: {probs[2]:.3f}"
                    )


            predicted_class = class_names[
                prediction.item()
            ]

            classification_confidence = (
                confidence.item() * 100
            )


            # ------------------------------------------------
            # Bounding box color
            # ------------------------------------------------

            # Green = Fully Visible
            # Blue  = PPE Compliant
            # Red   = Unauthorized Occlusion

            if prediction.item() == 0:

                box_color = (0, 255, 0)

            elif prediction.item() == 1:

                box_color = (255, 0, 0)

            else:

                box_color = (0, 0, 255)


            # ------------------------------------------------
            # Draw face bounding box
            # ------------------------------------------------

            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                box_color,
                3
            )


            # ------------------------------------------------
            # Classification label
            # ------------------------------------------------

            label = (
                f"{predicted_class} "
                f"{classification_confidence:.1f}%"
            )


            # ------------------------------------------------
            # Label background
            # ------------------------------------------------

            text_size = cv2.getTextSize(
                label,
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                2
            )[0]


            text_width = text_size[0]
            text_height = text_size[1]


            label_y = max(
                y - 10,
                text_height + 10
            )


            cv2.rectangle(
                frame,
                (
                    x,
                    label_y - text_height - 10
                ),
                (
                    x + text_width + 10,
                    label_y + 5
                ),
                box_color,
                -1
            )


            # ------------------------------------------------
            # Draw label text
            # ------------------------------------------------

            cv2.putText(
                frame,
                label,
                (
                    x + 5,
                    label_y - 2
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )


            # ------------------------------------------------
            # YuNet detection confidence
            # ------------------------------------------------

            detector_text = (
                f"Face: {detection_confidence:.2f}"
            )


            cv2.putText(
                frame,
                detector_text,
                (
                    x,
                    y + h + 25
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                box_color,
                2,
                cv2.LINE_AA
            )


    # --------------------------------------------------------
    # Header
    # --------------------------------------------------------

    cv2.rectangle(
        frame,
        (0, 0),
        (frame.shape[1], 55),
        (0, 0, 0),
        -1
    )


    cv2.putText(
        frame,
        "LABORATORY CCTV - FACIAL OCCLUSION MONITOR",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )


    # --------------------------------------------------------
    # Legend
    # --------------------------------------------------------

    cv2.putText(
        frame,
        "GREEN: Fully Visible",
        (20, frame.shape[0] - 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (0, 255, 0),
        2,
        cv2.LINE_AA
    )


    cv2.putText(
        frame,
        "BLUE: PPE Compliant",
        (230, frame.shape[0] - 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 0, 0),
        2,
        cv2.LINE_AA
    )


    cv2.putText(
        frame,
        "RED: Unauthorized",
        (450, frame.shape[0] - 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (0, 0, 255),
        2,
        cv2.LINE_AA
    )


    cv2.putText(
        frame,
        "Press Q to quit",
        (20, frame.shape[0] - 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )


    # --------------------------------------------------------
    # Show webcam
    # -------------------------------------------------------

    # --------------------------------------------------------
    # SHOW LARGE CCTV DISPLAY
    # --------------------------------------------------------

    cv2.imshow(window_name, frame)


    # --------------------------------------------------------
    # Quit
    # --------------------------------------------------------

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ------------------------------------------------------------
# CLEANUP
# ------------------------------------------------------------

camera.release()
cv2.destroyAllWindows()

print("\nWebcam closed.")
print("Laboratory CCTV stopped.")