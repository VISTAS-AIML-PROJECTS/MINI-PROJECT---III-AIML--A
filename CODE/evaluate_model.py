import os
import torch
import numpy as np
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support
)

# ============================================================
# FACIAL OCCLUSION CLASSIFIER - TEST SET EVALUATION
# ============================================================

print("=" * 60)
print("FACIAL OCCLUSION CLASSIFIER - TEST EVALUATION")
print("=" * 60)

# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TEST_DIR = os.path.join(BASE_DIR, "dataset", "test")
MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "facial_occlusion_resnet18.pth"
)

# ------------------------------------------------------------
# Device
# ------------------------------------------------------------

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"\nDevice: {device}")

# ------------------------------------------------------------
# Class names
# ------------------------------------------------------------

class_names = [
    "fully_visible",
    "ppe_compliant",
    "unauthorized"
]

print(f"Classes: {class_names}")

# ------------------------------------------------------------
# Image preprocessing
# Must match validation preprocessing used during training
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
# Load test dataset
# ------------------------------------------------------------

test_dataset = datasets.ImageFolder(
    TEST_DIR,
    transform=transform
)

test_loader = DataLoader(
    test_dataset,
    batch_size=16,
    shuffle=False,
    num_workers=0
)

print(f"\nTest images: {len(test_dataset)}")
print(f"Dataset classes: {test_dataset.classes}")

# ------------------------------------------------------------
# Display test class counts
# ------------------------------------------------------------

print("\nTest class counts:")

for class_index, class_name in enumerate(test_dataset.classes):
    count = sum(
        1 for _, label in test_dataset.samples
        if label == class_index
    )
    print(f"  {class_name}: {count}")

# ------------------------------------------------------------
# Load ResNet18
# ------------------------------------------------------------

print("\nLoading trained ResNet18 model...")

model = models.resnet18(weights=None)

# Replace final layer
model.fc = torch.nn.Linear(
    model.fc.in_features,
    len(class_names)
)

# Load trained weights
checkpoint = torch.load(
    MODEL_PATH,
    map_location=device
)

# Handle both possible checkpoint formats
if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])
else:
    model.load_state_dict(checkpoint)

model = model.to(device)
model.eval()

print("Model loaded successfully.")

# ------------------------------------------------------------
# Run evaluation
# ------------------------------------------------------------

all_predictions = []
all_labels = []

print("\nRunning evaluation...")

with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)

        predictions = torch.argmax(
            outputs,
            dim=1
        )

        all_predictions.extend(
            predictions.cpu().numpy()
        )

        all_labels.extend(
            labels.cpu().numpy()
        )

# Convert to NumPy arrays
all_predictions = np.array(all_predictions)
all_labels = np.array(all_labels)

# ------------------------------------------------------------
# Overall accuracy
# ------------------------------------------------------------

accuracy = accuracy_score(
    all_labels,
    all_predictions
)

print("\n" + "=" * 60)
print("OVERALL TEST RESULTS")
print("=" * 60)

print(f"\nTest Accuracy: {accuracy * 100:.2f}%")
print(
    f"Correct predictions: "
    f"{np.sum(all_predictions == all_labels)} / "
    f"{len(all_labels)}"
)

# ------------------------------------------------------------
# Classification report
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)

report = classification_report(
    all_labels,
    all_predictions,
    target_names=class_names,
    labels=[0, 1, 2],
    digits=4,
    zero_division=0
)

print(report)

# ------------------------------------------------------------
# Precision / Recall / F1
# ------------------------------------------------------------

precision, recall, f1, support = precision_recall_fscore_support(
    all_labels,
    all_predictions,
    labels=[0, 1, 2],
    zero_division=0
)

print("=" * 60)
print("PER-CLASS PERFORMANCE")
print("=" * 60)

for i, class_name in enumerate(class_names):

    print(f"\n{class_name}")
    print(f"  Precision: {precision[i] * 100:.2f}%")
    print(f"  Recall:    {recall[i] * 100:.2f}%")
    print(f"  F1-score:  {f1[i] * 100:.2f}%")
    print(f"  Test images: {support[i]}")

# ------------------------------------------------------------
# Confusion matrix
# ------------------------------------------------------------

cm = confusion_matrix(
    all_labels,
    all_predictions,
    labels=[0, 1, 2]
)

print("\n" + "=" * 60)
print("CONFUSION MATRIX")
print("=" * 60)

print("\nRows = Actual class")
print("Columns = Predicted class\n")

print(
    f"{'':25}"
    f"{'Fully Visible':>18}"
    f"{'PPE Compliant':>18}"
    f"{'Unauthorized':>18}"
)

for i, class_name in enumerate(class_names):

    print(
        f"{class_name:25}"
        f"{cm[i][0]:>18}"
        f"{cm[i][1]:>18}"
        f"{cm[i][2]:>18}"
    )

# ------------------------------------------------------------
# Detailed interpretation
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("INTERPRETATION")
print("=" * 60)

for i, class_name in enumerate(class_names):

    correct = cm[i][i]
    total = cm[i].sum()

    if total > 0:
        class_accuracy = correct / total * 100
    else:
        class_accuracy = 0

    print(
        f"\n{class_name}: "
        f"{correct}/{total} correctly classified "
        f"({class_accuracy:.2f}%)"
    )

# ------------------------------------------------------------
# Save predictions
# ------------------------------------------------------------

results_file = os.path.join(
    BASE_DIR,
    "models",
    "test_predictions.txt"
)

with open(results_file, "w", encoding="utf-8") as f:

    f.write("FACIAL OCCLUSION CLASSIFIER - TEST RESULTS\n")
    f.write("=" * 60 + "\n\n")

    f.write(f"Test Accuracy: {accuracy * 100:.2f}%\n\n")

    f.write("Classification Report\n")
    f.write("-" * 60 + "\n")
    f.write(report)

    f.write("\n\nConfusion Matrix\n")
    f.write("-" * 60 + "\n")
    f.write(str(cm))

print("\n" + "=" * 60)
print("EVALUATION COMPLETE")
print("=" * 60)

print(f"\nResults saved to:")
print(results_file)