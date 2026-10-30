
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:

    APP_NAME = "Legal Mate AI"

    APP_DESCRIPTION = (
        "AI-Powered Legal Guidance and "
        "Complaint Assistance System for India"
    )

    VERSION = "1.0.0"

    API_HOST = os.getenv("API_HOST", "0.0.0.0")

    API_PORT = int(os.getenv("API_PORT", "8000"))

    ENVIRONMENT = os.getenv(
        "ENVIRONMENT",
        "development"
    )

    DEFAULT_LANGUAGE = "English"

    SUPPORTED_LANGUAGES = [
        "English",
        "Tamil"
    ]


settings = Settings()
