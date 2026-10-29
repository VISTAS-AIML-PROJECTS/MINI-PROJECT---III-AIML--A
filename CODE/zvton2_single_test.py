import os
import glob
import cv2
import torch
import numpy as np

from PIL import Image, ImageFilter
from diffusers.image_processor import VaeImageProcessor

from modules.densepose import DensePose, densepose_to_rgb
from modules.pipeline import V2TONPipeline
from modules.cloth_masker import AutoMasker


# ============================================================
# ZcannerReality - ZvTon2 single image test
# ============================================================

PERSON_IMAGE = r"C:/ZcannerReality/ZvTon2/camera_test.jpg"
GARMENT_IMAGE = r"C:/ZcannerReality/ZVTON/garment.jpg"

OUTPUT_DIR = r"C:/ZcannerReality/ZvTon2/zvton2_output"

WIDTH = 384
HEIGHT = 512

STEPS = 10
GUIDANCE = 3.0
SEED = 42

DEVICE = "cuda"
DTYPE = torch.float16


# ============================================================
# Find downloaded HuggingFace models
# ============================================================

BASE_CANDIDATES = glob.glob(
    r"C:/Users/GNANESHWARAN/.cache/huggingface/hub/"
    r"models--alibaba-pai--EasyAnimateV4-XL-2-InP/snapshots/*"
)

ZVTON2_MODEL_CANDIDATES = glob.glob(
    r"C:/Users/GNANESHWARAN/.cache/huggingface/hub/"
    r"models--zhengchong--CatV2TON/snapshots/*"
)

CATVTON_CANDIDATES = glob.glob(
    r"C:/Users/GNANESHWARAN/.cache/huggingface/hub/"
    r"models--zhengchong--CatVTON/snapshots/*"
)


if not BASE_CANDIDATES:
    raise RuntimeError("EasyAnimate model was not found in HuggingFace cache.")

if not ZVTON2_MODEL_CANDIDATES:
    raise RuntimeError("ZvTon2 model was not found in HuggingFace cache.")

if not CATVTON_CANDIDATES:
    raise RuntimeError("CatVTON auxiliary model was not found in HuggingFace cache.")


BASE_MODEL = BASE_CANDIDATES[0]
ZVTON2_MODEL = ZVTON2_MODEL_CANDIDATES[0]
CATVTON_MODEL = CATVTON_CANDIDATES[0]

FINETUNED_MODEL = os.path.join(
    ZVTON2_MODEL,
    "512-64K"
)

DENSEPOSE_MODEL = os.path.join(
    CATVTON_MODEL,
    "DensePose"
)


print()
print("============================================================")
print("ZVTON2 SINGLE IMAGE TEST")
print("============================================================")
print("Person :", PERSON_IMAGE)
print("Garment:", GARMENT_IMAGE)
print("Base   :", BASE_MODEL)
print("V2TON  :", FINETUNED_MODEL)
print("CatVTON:", CATVTON_MODEL)
print("============================================================")
print()


# ============================================================
# Check input files
# ============================================================

if not os.path.exists(PERSON_IMAGE):
    raise FileNotFoundError(PERSON_IMAGE)

if not os.path.exists(GARMENT_IMAGE):
    raise FileNotFoundError(GARMENT_IMAGE)

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# Load ZvTon2
# ============================================================

print("[1/6] Loading ZvTon2...")

pipeline = V2TONPipeline(
    base_model_path=BASE_MODEL,
    finetuned_model_path=FINETUNED_MODEL,
    torch_dtype=DTYPE,
    device=DEVICE,
    load_pose=True,
)

print("ZvTon2 loaded.")


# ============================================================
# Load DensePose
# ============================================================

print("[2/6] Running DensePose...")

densepose_model = DensePose(
    model_path=DENSEPOSE_MODEL,
    device=DEVICE,
)

person_image = Image.open(PERSON_IMAGE).convert("RGB")

densepose_gray = densepose_model(
    person_image,
    resize=512,
    colormap=None,
)

print("DensePose complete.")


# ============================================================
# Generate clothing mask + DensePose condition
# ============================================================

print("[3/6] Generating clothing mask...")

automasker = AutoMasker(
    densepose_ckpt=os.path.join(CATVTON_MODEL, "DensePose"),
    schp_ckpt=os.path.join(CATVTON_MODEL, "SCHP"),
    device=DEVICE,
)

conditions = automasker(
    person_image,
    "upper",
)

original_mask = conditions["mask"]

print("Mask generated.")


# ============================================================
# Prepare model inputs
# ============================================================

print("[4/6] Preparing tensors...")

pose = densepose_to_rgb(
    densepose_gray,
    colormap=cv2.COLORMAP_VIRIDIS,
)

mask = original_mask.convert("RGB")

vae_processor = VaeImageProcessor(
    vae_scale_factor=8
)

person_tensor = vae_processor.preprocess(person_image, HEIGHT, WIDTH)[0].unsqueeze(1).to(device=DEVICE, dtype=DTYPE)

cloth_tensor = vae_processor.preprocess(Image.open(GARMENT_IMAGE).convert("RGB"), HEIGHT, WIDTH)[0].unsqueeze(1).to(device=DEVICE, dtype=DTYPE)

pose_tensor = vae_processor.preprocess(pose, HEIGHT, WIDTH)[0].unsqueeze(1).to(device=DEVICE, dtype=DTYPE)

mask_tensor = vae_processor.preprocess(mask, HEIGHT, WIDTH)[0].unsqueeze(1).to(device=DEVICE, dtype=DTYPE)


print("Person tensor :", tuple(person_tensor.shape))
print("Cloth tensor  :", tuple(cloth_tensor.shape))
print("Pose tensor   :", tuple(pose_tensor.shape))
print("Mask tensor   :", tuple(mask_tensor.shape))


# ============================================================
# ZvTon2 inference
# ============================================================

print()
print("[5/6] RUNNING ZVTON2 INFERENCE...")
print("Steps:", STEPS)
print()

generator = torch.Generator(
    device="cuda"
).manual_seed(SEED)


with torch.no_grad():

    results = pipeline.image_try_on(
        source_image=person_tensor,
        source_mask=mask_tensor,
        conditioned_image=cloth_tensor,
        pose_image=pose_tensor,
        num_inference_steps=STEPS,
        guidance_scale=GUIDANCE,
        generator=generator,
    )


# ============================================================
# Save result
# ============================================================

result = results[0]

result_path = os.path.join(
    OUTPUT_DIR,
    "zvton2_result.png"
)

result.save(result_path)

print()
print("[6/6] RESULT SAVED")
print(result_path)
print()


# ============================================================
# Optional repaint
# ============================================================

print("Creating repaint result...")

def repaint(person, mask, result):

    _, h = result.size

    kernel_size = h // 50

    if kernel_size % 2 == 0:
        kernel_size += 1

    mask = mask.filter(
        ImageFilter.GaussianBlur(kernel_size)
    )

    person_np = np.array(person).astype(np.float32)
    result_np = np.array(result).astype(np.float32)
    mask_np = np.array(mask).astype(np.float32) / 255.0

    output = (
        person_np * (1.0 - mask_np)
        + result_np * mask_np
    )

    output = np.clip(
        output,
        0,
        255
    ).astype(np.uint8)

    return Image.fromarray(output)


repaint_result = repaint(
    person_image.resize(result.size, Image.LANCZOS),
    original_mask.resize(result.size, Image.NEAREST).convert("RGB"),
    result
)

repaint_path = os.path.join(
    OUTPUT_DIR,
    "zvton2_result_repaint.png"
)

repaint_result.save(repaint_path)

print("Repaint result:")
print(repaint_path)
print()
print("============================================================")
print("ZVTON2 TEST FINISHED")
print("============================================================")
