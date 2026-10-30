
from pydantic import BaseModel, Field
from typing import List


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    language: str = "English"


class ChatResponse(BaseModel):
    success: bool
    user_query: str
    intent: str
    domain: str
    answer: str
    sources: List[str] = []
    language: str
    disclaimer: str


class ComplaintRequest(BaseModel):
    name: str = "Not provided"
    category: str
    issue: str
    facts: str
    language: str = "English"


class ComplaintResponse(BaseModel):
    success: bool
    complaint_title: str
    complaint_draft: str
    disclaimer: str
