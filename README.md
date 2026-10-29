# ZcannerReality 
### AI-Based Universal Virtual Try-On and Digital Twin Generation

**ZcannerReality** is an AI-powered product visualization project that combines computer vision, deep learning, footwear detection, and virtual try-on technology to make online shopping more interactive and personalized.

The project explores how users can identify footwear from images and visualize clothing on a person image using AI-based virtual try-on models. It brings together object detection, image preprocessing, human parsing, and a user interface to establish a foundation for future digital twin generation.

> **Project status:** Research and prototype development. Footwear detection and virtual try-on integration are the primary focus. Comprehensive digital twin generation and universal multi-category try-on are future development goals.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Footwear Detection](#-footwear-detection)
- [Virtual Try-On](#-virtual-try-on)
- [Dataset](#-dataset)
- [Hardware Requirements](#-hardware-requirements)
- [Installation](#-installation)
- [Running the Project](#-running-the-project)
- [Project Structure](#-project-structure)
- [Expected Workflow](#-expected-workflow)
- [Current Limitations](#-current-limitations)
- [Future Enhancements](#-future-enhancements)
- [Research References](#-research-references)
- [Project Team](#-project-team)
- [License](#-license)

---

## 🚀 Project Overview

Traditional e-commerce platforms primarily display static product images, descriptions, and size charts. Customers often find it difficult to visualize how footwear or clothing might look when worn by them.

ZcannerReality aims to address this challenge by integrating AI-based footwear detection with virtual try-on technology.

The project consists of two main processing paths:

1. **Footwear Detection:** Uses YOLO-based object detection to locate and classify footwear in an input image.
2. **Virtual Try-On:** Uses a person image, a selected garment image, image preprocessing, and a compatible virtual try-on model to generate a clothing visualization.

A user interface provides access to the available functionality and displays the relevant outputs.

The long-term vision is to extend this system towards personalized digital twins and broader product visualization across fashion and e-commerce.

## 🎯 Problem Statement

Online shoppers cannot physically try products before purchasing them. Static product images provide limited information about how a product may look when worn by a particular person.

The main challenges addressed by this project are:

- Limited visualization of footwear and clothing before purchase.
- Manual identification and classification of footwear products.
- Lack of personalized clothing visualization using user-provided images.
- Image preprocessing and alignment challenges in virtual try-on.
- Difficulty integrating object detection and virtual try-on into one accessible application.

ZcannerReality explores an AI-based approach to make product discovery and visualization more interactive.

## 🎯 Objectives

- Detect and classify footwear using YOLOv8 and YOLO-World.
- Recognize footwear categories represented by the selected model and dataset.
- Integrate a virtual try-on pipeline for clothing visualization.
- Prepare person and garment images using suitable image-processing techniques.
- Explore human parsing and mask generation for virtual try-on.
- Provide an interface for interacting with the available modules.
- Establish a foundation for future digital twin generation and multi-category product visualization.

## ✨ Key Features

### 1. AI-Based Footwear Detection

Uses YOLO-based models to identify footwear objects and display predicted class labels and bounding boxes.

Supported dataset categories:

- Boots
- Heels
- Sandals
- Shoes
- Slippers
- Sneakers

The actual categories recognized depend on the model configuration and trained weights.

### 2. Virtual Try-On Integration

The project explores AI-based clothing visualization using a person image and a selected garment image.

The virtual try-on workflow can involve image preprocessing, human parsing, mask generation, and model inference, depending on the selected backend.

### 3. Image Processing

Image-processing operations prepare input images for the selected detection or virtual try-on model.

### 4. Human Parsing and Mask Generation

Human parsing and masks can help identify relevant image regions and prepare inputs for compatible virtual try-on pipelines.

### 5. Interactive Application

The project includes a user-interface workflow for interacting with the available detection and virtual try-on functionality. The documented prototype also includes a ZVTON2 interface with camera controls, garment selection, and CatV2TON result-generation controls.

### 6. Extensible Architecture

The project is structured around separate processing components, providing a foundation for integrating additional models and product categories.

---

## 🏗️ System Architecture

The system follows a modular workflow.

```text
                    USER INPUT
                        |
              Upload Required Images
                        |
              Select Processing Mode
                        |
             +----------+----------+
             |                     |
             v                     v
      FOOTWEAR DETECTION      VIRTUAL TRY-ON
             |                     |
       Input Image          Person + Garment
             |                     |
        Image Input          Preprocessing
             |                     |
      YOLOv8 / YOLO-World    Human Parsing /
             |               Mask Generation
       Object Detection            |
             |                     v
       Class Labels          Try-On Model
       Bounding Boxes              |
       Confidence Scores           v
             |                Generated Image
             |                     |
             +----------+----------+
                        |
                        v
                 RESULT DISPLAY
                        |
                        v
                 USER INTERFACE
```

The footwear detection and virtual try-on paths perform different tasks. Detection identifies objects, whereas virtual try-on generates a new visual representation.

**Note:** The diagram describes the intended integrated workflow. The exact degree of integration depends on the current application configuration and the availability of the required model weights and dependencies.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Python | Primary programming language |
| PyTorch | Deep-learning model execution |
| YOLOv8 | Footwear object detection |
| YOLO-World | Open-vocabulary object detection experiments |
| OpenCV | Image processing and computer vision |
| NumPy | Numerical operations and image-data processing |
| Streamlit | Web-based application interface |
| SegFormer | Semantic segmentation and human parsing where integrated |
| VITON-HD | Research reference for high-resolution clothing virtual try-on |
| CatV2TON | Virtual try-on backend option in the documented interface |

The exact libraries and models required depend on which components are enabled in the checked-out version of the project. Mention a model as an active dependency only if it is actually integrated into that version.

## 👟 Footwear Detection

The footwear detection component uses YOLO-based object detection to identify footwear objects in images.

### Processing pipeline

1. Load the configured YOLO model and weights.
2. Receive a footwear image.
3. Run model inference.
4. Extract detected classes, bounding boxes, and confidence scores.
5. Display the results.

### Example inference

The following is a minimal example. Replace `best.pt` with the actual trained model path in your repository.

```python
from ultralytics import YOLO

# Load trained footwear detection weights
model = YOLO("best.pt")

# Run inference on an image
results = model("input.jpg")

# Display detections
for result in results:
    result.show()
```

This example illustrates the inference workflow; it does not imply that the file `best.pt` is already included in the repository.

### Model evaluation

Detection performance should be evaluated using a separate test dataset. Useful metrics include:

- Precision
- Recall
- mAP@0.5
- mAP@0.5:0.95
- Inference time

Numerical results should be added to this README only after they have been measured and verified.

## 👕 Virtual Try-On

The virtual try-on component aims to generate a visual representation of selected clothing on a person image.

### General workflow

1. Provide a person image.
2. Select or upload a garment image.
3. Preprocess the required inputs.
4. Generate human-parsing information or masks when required.
5. Execute the compatible virtual try-on model.
6. Display the generated output.

The project documentation includes a ZVTON2 interface with the following controls:

- Start Camera
- Stop Camera
- Select Garment
- Enable Real-Time Try-On
- Generate High-Quality CatV2TON Result
- Show CatV2TON Result
- Quit

These controls describe the documented interface. Successful output generation depends on the backend, model weights, hardware compatibility, and configuration.

**Important:** VITON-HD is a clothing virtual try-on research method, not a footwear detection model. Footwear try-on requires appropriate footwear-specific processing or another compatible model.

## 📂 Dataset

### Footwear Detection Dataset

The project uses a footwear dataset hosted on Roboflow Universe.

**Dataset:** [Footwear Dataset – Roboflow Universe](https://universe.roboflow.com/namans-workspace-fzlvo/footwear-dataset-8aitv)

The documented classes are Boots, Heels, Sandals, Shoes, Slipers, and Sneakers. Verify the spelling of `Slipers` against your final dataset configuration before training or reporting results.

A YOLO dataset typically contains training, validation, and testing images with corresponding annotations, together with a `data.yaml` configuration file.

Example configuration format:

```yaml
train: path/to/train/images
val: path/to/valid/images
test: path/to/test/images

nc: 6

names:
  - Boots
  - Heels
  - Sandals
  - Shoes
  - Slipers
  - Sneakers
```

Use the actual dataset paths and class names from your own `data.yaml` file.

### Virtual Try-On Research Resources

[VITON-HD – Project Page](https://psh01087.github.io/VITON-HD/)

VITON-HD is relevant to clothing virtual try-on research. Dataset access, licensing, and model requirements should be checked before using it.

## 💻 Hardware Requirements

### Development environment

- **Processor:** AMD Ryzen 5 5500U
- **RAM:** 32 GB
- **Operating system:** Windows development environment
- **GPU:** Optional for compatible workloads; verify the requirements of the selected try-on backend

The footwear detection component can be tested using CPU-based inference when the model and environment support it. High-resolution virtual try-on models can require considerably more memory and processing power.

## ⚙️ Installation

The commands below describe a typical Python setup. Install the dependencies required by the actual application and virtual try-on backend.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ZcannerReality
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the actual URL of your GitHub repository.

### 2. Create a virtual environment

On Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install dependencies

For a project that uses a `requirements.txt` file:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If the repository does not yet contain `requirements.txt`, install the dependencies specified by your actual code and the selected model repository. Do not combine incompatible PyTorch, CUDA, or model-specific dependency versions.

### 4. Configure model weights

Place the required trained weights in the configured locations, or update the model paths in the code.

Examples of possible files include:

- Trained YOLO footwear detection weights.
- Virtual try-on model checkpoints.
- Human-parsing or segmentation weights, if required.

These are examples of model artefacts; their exact filenames depend on your implementation. Large model files may need to be downloaded separately according to the original model's instructions.

## ▶️ Running the Project

Use the command that matches the actual entry point in your repository.

### Footwear detection

If your project has a detection script, run it using its actual filename and arguments. For example, a standalone Ultralytics inference command is:

```bash
yolo predict model=path/to/your_weights.pt source=path/to/your_image.jpg
```

Replace the example paths with your real model and image paths.

### Streamlit application

If the Streamlit interface is implemented in `app.py`, start it with:

```bash
streamlit run app.py
```

If your project uses a different filename or a separate application for virtual try-on, use the corresponding launch command.

### Virtual try-on application

Follow the setup instructions for the specific virtual try-on repository integrated into your project. Configure its checkpoints, preprocessing assets, dependencies, and inference settings before running it.

**Do not assume that the detection application and the ZVTON2/CatV2TON interface start using the same command.** They may be separate components.

## 📁 Project Structure

The final structure should reflect the files that actually exist in your repository. A possible organization is:

```text
ZcannerReality/
├── README.md
├── requirements.txt
├── data.yaml
├── app.py
├── train.py
├── detect.py
├── models/
│   └── README.md
├── datasets/
│   └── README.md
├── virtual_tryon/
│   └── README.md
├── assets/
│   └── screenshots/
└── docs/
    └── project-report.pdf
```

This is an example structure, not a claim that all these files and folders already exist. Retain your actual filenames and directories when updating the README.

## 🔄 Expected Workflow

1. Launch the relevant application.
2. Choose footwear detection or virtual try-on.
3. Upload the required input image or images.
4. Run the selected processing operation.
5. Review the detection output or generated try-on image.
6. Repeat with other inputs as needed.

For the virtual try-on workflow, a generated result is available only when the configured model completes inference successfully.

## ⚠️ Current Limitations

- Detection accuracy depends on the training data, annotations, and model configuration.
- Virtual try-on output depends on the selected backend and the quality of the input images.
- Clothing try-on does not automatically provide footwear try-on.
- Deep-learning inference may be slow on CPU-only systems.
- Some virtual try-on backends require additional checkpoints and dependencies.
- The application interface alone does not prove that every model or feature is fully operational.
- Comprehensive digital twin generation and universal multi-category support remain future goals.
- Virtual try-on images are visual approximations and do not guarantee real-world fit, size, comfort, or product suitability.

## 🔮 Future Enhancements

Planned development directions include:

- Improved footwear detection and model evaluation.
- Integration of additional clothing and accessory categories.
- Footwear-specific virtual try-on.
- Improved human parsing, mask generation, and image alignment.
- More efficient inference on consumer hardware.
- Real-time camera-based visualization.
- More comprehensive personalized digital twin generation.
- Product comparison and recommendation features.
- Broader testing across varied images and operating conditions.

These items represent possible future work and should not be interpreted as completed features.

## 📚 Research References

1. Redmon, J., Divvala, S., Girshick, R., and Farhadi, A. *You Only Look Once: Unified, Real-Time Object Detection.* CVPR, 2016.

2. Cheng, T. et al. *YOLO-World: Real-Time Open-Vocabulary Object Detection.* CVPR, 2024. [Paper](https://openaccess.thecvf.com/content/CVPR2024/html/Cheng_YOLO-World_Real-Time_Open-Vocabulary_Object_Detection_CVPR_2024_paper.html)

3. Choi, S. et al. *VITON-HD: High-Resolution Virtual Try-On via Misalignment-Aware Normalization.* CVPR, 2021. [Paper](https://openaccess.thecvf.com/content/CVPR2021/html/Choi_VITON-HD_High-Resolution_Virtual_Try-On_via_Misalignment-Aware_Normalization_CVPR_2021_paper.html)

4. Xie, E. et al. *SegFormer: Simple and Efficient Design for Semantic Segmentation with Transformers.* NeurIPS, 2021. [Paper](https://papers.nips.cc/paper/2021/hash/64f1f27bf1b4ec22924fd0acb550c235-Abstract.html)

5. Ultralytics. [YOLO-World Documentation](https://docs.ultralytics.com/models/yolo-world/)

6. VITON-HD. [Official Project Page](https://psh01087.github.io/VITON-HD/)

## 👨‍💻 Project Team

**Project Title:** ZcannerReality: AI-Based Universal Virtual Try-On and Digital Twin Generation

- **Jaison J** — 24619143
- **Gnaneshwaran S** — 24619112
- **Karthikeyan P** — 24619147

**Project Guide:** Dr. K. Ulaga Priya

**Institution:** Vels Institute of Science, Technology and Advanced Studies (VISTAS), Chennai

**Department:** Artificial Intelligence and Machine Learning

**Academic Year:** 2026

## 📄 License

A license has not been specified for this project yet. Before publishing the repository, select a license appropriate for your source code and verify the licenses of all third-party models, datasets, checkpoints, and repositories you use. A license added to your own repository does not override the terms of third-party components.
