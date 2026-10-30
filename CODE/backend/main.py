app = FastAPI(
    title="Legal Mate AI",
    description="AI-Powered Legal Guidance and Complaint Assistance System for India",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Welcome to Legal Mate AI Backend",
        "status": "Running",
        "project": "Legal Mate AI"
    }
