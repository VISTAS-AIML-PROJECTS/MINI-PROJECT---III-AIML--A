from fastapi import FastAPI, UploadFile, File
import shutil
import os

from resume_parser import analyze_resume

app = FastAPI()


@app.get("/")
def home():
    return {"message": "CARA Backend is Running!"}


@app.post("/analyze-resume")
async def analyze_resume_api(file: UploadFile = File(...)):

    os.makedirs("uploads", exist_ok=True)

    file_path = os.path.join("uploads", file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = analyze_resume(file_path)

    return {
        "message": "Resume analyzed successfully!",
        "filename": file.filename,
        "skills": result["skills"],
        "sections": result["sections"]
    }