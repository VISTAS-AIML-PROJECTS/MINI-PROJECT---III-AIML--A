import os
import cv2
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

# ============================================================
# FACIAL OCCLUSION CLASSIFIER - REAL-TIME WEBCAM DEMO
# ============================================================

print("=" * 60)
print("FACIAL OCCLUSION CLASSIFIER - WEBCAM DEMO")
print("=" * 60)

# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "facial_occlusion_resnet18.pth"
)

# ------------------------------------------------------------
# Device
# ------------------------------------------------------------

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print(f"\nDevice: {device}")

# ------------------------------------------------------------
# Classes
# ------------------------------------------------------------

class_names = [
    "Fully Visible",
    "PPE Compliant",
    "Unauthorized Occlusion"
]

# ------------------------------------------------------------
# Load model
# ------------------------------------------------------------

print("\nLoading trained ResNet18 model...")

model = models.resnet18(weights=None)

model.fc = nn.Linear(
    model.fc.in_features,
    len(class_names)
)

checkpoint = torch.load(
    MODEL_PATH,
    map_location=device
)

if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])
else:
    model.load_state_dict(checkpoint)

model = model.to(device)
model.eval()

print("Model loaded successfully.")

# ------------------------------------------------------------
# Image preprocessing
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
# Open webcam
# ------------------------------------------------------------

print("\nOpening webcam...")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("\nERROR: Could not open webcam.")
    print("Check that your webcam is connected and not being")
    print("used by another application.")
    raise SystemExit

# Set webcam resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

print("\nWebcam started.")
print("Press Q to quit.")

# ------------------------------------------------------------
# Prediction loop
# ------------------------------------------------------------

while True:

    ret, frame = cap.read()

    if not ret:
        print("ERROR: Could not read webcam frame.")
        break

    # --------------------------------------------------------
    # Convert OpenCV BGR image to RGB
    # --------------------------------------------------------

    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    # Convert to PIL image
    pil_image = Image.fromarray(rgb_frame)

    # Apply preprocessing
    input_tensor = transform(pil_image)

    # Add batch dimension
    input_tensor = input_tensor.unsqueeze(0)

    input_tensor = input_tensor.to(device)

    # --------------------------------------------------------
    # Model prediction
    # --------------------------------------------------------

    with torch.no_grad():

        outputs = model(input_tensor)

        probabilities = torch.softmax(
            outputs,
            dim=1
        )

        confidence, prediction = torch.max(
            probabilities,
            dim=1
        )

    predicted_class = class_names[
        prediction.item()
    ]

    confidence_value = confidence.item() * 100

    # --------------------------------------------------------
    # Display information
    # --------------------------------------------------------

    label = (
        f"{predicted_class}: "
        f"{confidence_value:.1f}%"
    )

    # Background rectangle
    cv2.rectangle(
        frame,
        (20, 20),
        (650, 90),
        (0, 0, 0),
        -1
    )

    # Prediction text
    cv2.putText(
        frame,
        label,
        (35, 65),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    # --------------------------------------------------------
    # Display all class probabilities
    # --------------------------------------------------------

    y_position = 130

    for i, class_name in enumerate(class_names):

        probability = (
            probabilities[0][i].item() * 100
        )

        probability_text = (
            f"{class_name}: {probability:.1f}%"
        )

        cv2.putText(
            frame,
            probability_text,
            (30, y_position),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )

        y_position += 35

    # --------------------------------------------------------
    # Quit instruction
    # --------------------------------------------------------

    cv2.putText(
        frame,
        "Press Q to quit",
        (30, frame.shape[0] - 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    # --------------------------------------------------------
    # Show webcam
    # --------------------------------------------------------

    cv2.imshow(
        "Facial Occlusion Classifier",
        frame
    )

    # Press Q to quit
    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

# ------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------

cap.release()
cv2.destroyAllWindows()

print("\nWebcam demo closed.")
print("Program finished.")