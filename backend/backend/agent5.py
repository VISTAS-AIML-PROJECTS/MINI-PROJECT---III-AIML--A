
from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter()

class InterviewRequest(BaseModel):
    role: str = "Software Engineer"
    resume_text: str = ""
    question_number: int = 1

class AnswerRequest(BaseModel):
    role: str = "Software Engineer"
    resume_text: str = ""
    question_number: int = 1
    question: str = ""
    answer: str = ""

questions = [
    "Tell me about yourself.",
    "Can you explain your strongest technical skill?",
    "Tell me about a project you have worked on.",
    "What was your role in that project?",
    "How do you handle a difficult technical problem?",
    "Tell me about a time you worked in a team.",
    "How do you learn a new technology?",
    "Why are you interested in this role?",
    "What are your strengths and areas for improvement?",
    "Why should we consider you for this role?"
]

TOTAL_QUESTIONS = len(questions)
interview_sessions = {}

def evaluate_answer(request):
    answer = request.answer.strip()
    question = request.question.strip()
    resume = request.resume_text.strip()

    if not answer:
        return {
            "score": 0,
            "feedback": "No answer provided. Please answer the question."
        }

    normalized = re.sub(r"[^\w\s+#.-]", "", answer.lower()).strip()
    words = re.findall(r"\b[\w+#.-]+\b", answer)
    word_count = len(words)

    meaningless = {
        "hi", "hello", "ok", "okay", "yes", "no", "hmm",
        "nothing", "i don't know", "idk", "good", "fine",
        "thank you", "thanks", "test"
    }

    if normalized in meaningless or word_count < 3:
        return {
            "score": 0,
            "feedback": "Answer is too short or irrelevant. Please explain your answer."
        }

    score = 2.0
    answer_lower = answer.lower()

    if word_count >= 10:
        score += 1
    if word_count >= 25:
        score += 1
    if word_count >= 45:
        score += 1
    if word_count >= 70:
        score += 1

    technical_terms = [
        "python", "java", "sql", "api", "database", "model",
        "machine learning", "algorithm", "testing", "debug",
        "frontend", "backend", "react", "fastapi", "project",
        "developed", "implemented", "built", "designed",
        "team", "problem", "solution", "result"
    ]

    matched_terms = [
        term for term in technical_terms if term in answer_lower
    ]
    score += min(2, len(matched_terms) * 0.5)

    if any(phrase in answer_lower for phrase in [
        "because", "for example", "such as", "therefore",
        "first", "then", "finally", "as a result"
    ]):
        score += 1

    question_words = {
        word for word in re.findall(r"\b[a-zA-Z]{4,}\b", question.lower())
        if word not in {"your", "about", "what", "tell", "have", "with"}
    }
    answer_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", answer_lower))

    if question_words.intersection(answer_words):
        score += 1

    resume_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", resume.lower()))
    if answer_words.intersection(resume_words):
        score += 0.5

    score = round(min(10, score), 1)

    if score >= 8:
        feedback = "Strong answer. Add clear examples and keep your explanation specific."
    elif score >= 5:
        feedback = "Fair answer. Include relevant technical details and an example."
    else:
        feedback = "Develop your answer further. Explain what you did and the result."

    return {
        "score": score,
        "feedback": feedback,
        "word_count": word_count,
        "matched_technical_terms": matched_terms
    }

def build_final_result(session):
    evaluations = session["evaluations"]

    average = (
        sum(item["score"] for item in evaluations) / len(evaluations)
        if evaluations else 0
    )
    overall_score = round(average, 1)

    return {
        "score": overall_score,
        "overall_score": overall_score,
        "strengths": [
            "Answers were evaluated for detail and relevance",
            "Technical examples were considered"
        ],
        "areas_to_improve": [
            "Add specific examples",
            "Explain your technical contribution",
            "Describe outcomes and results"
        ],
        "improvement_plan": [
            "Use clear step-by-step explanations",
            "Practice explaining projects and technical decisions",
            "Include measurable results where possible"
        ],
        "question_scores": evaluations
    }

@router.get("/health")
def agent5_health():
    return {
        "status": "success",
        "agent": "Agent 5",
        "message": "Context-Aware Adaptive Mock Interview Agent is running"
    }

@router.post("/start")
def start_interview(request: InterviewRequest):
    number = min(max(request.question_number, 1), TOTAL_QUESTIONS)

    if number == 1:
        interview_sessions["current"] = {"evaluations": []}

    return {
        "status": "success",
        "question": questions[number - 1],
        "question_number": number,
        "total_questions": TOTAL_QUESTIONS,
        "difficulty": "Adaptive"
    }

@router.post("/next")
def next_question(request: InterviewRequest):
    number = min(max(request.question_number + 1, 1), TOTAL_QUESTIONS)

    return {
        "status": "success",
        "question": questions[number - 1],
        "question_number": number,
        "total_questions": TOTAL_QUESTIONS,
        "difficulty": "Adaptive"
    }

@router.post("/answer")
def submit_answer(request: AnswerRequest):
    number = min(max(request.question_number, 1), TOTAL_QUESTIONS)
    evaluation = evaluate_answer(request)

    session = interview_sessions.setdefault(
        "current", {"evaluations": []}
    )

    session["evaluations"] = [
        item for item in session["evaluations"]
        if item["question_number"] != number
    ]

    session["evaluations"].append({
        "question_number": number,
        "score": evaluation["score"],
        "feedback": evaluation["feedback"]
    })

    if number >= TOTAL_QUESTIONS:
        return {
            "status": "success",
            "finished": True,
            "completed": True,
            "evaluation": evaluation,
            "result": build_final_result(session)
        }

    next_number = number + 1

    return {
        "status": "success",
        "finished": False,
        "completed": False,
        "question": questions[next_number - 1],
        "next_question": questions[next_number - 1],
        "question_number": next_number,
        "total_questions": TOTAL_QUESTIONS,
        "difficulty": "Adaptive",
        "evaluation": evaluation
    }
