
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

# Stores answers during the current interview session.
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

    words = re.findall(r"\b[\w+#.-]+\b", answer)
    word_count = len(words)
    normalized = re.sub(r"[^\w\s+#.-]", "", answer.lower()).strip()

    meaningless = {
        "hi", "hello", "ok", "okay", "yes", "no", "hmm",
        "nothing", "i don't know", "idk", "good", "fine",
        "thank you", "thanks", "test"
    }

    if normalized in meaningless or word_count < 3:
        return {
            "score": 0,
            "feedback": "Your answer is too short or not relevant. Explain your idea with details."
        }

    score = 2
    feedback_points = []

    # Reward answers with enough explanation.
    if word_count >= 10:
        score += 1
    if word_count >= 25:
        score += 1
    if word_count >= 45:
        score += 1
    if word_count >= 70:
        score += 1

    # Reward examples, actions, and technical details.
    technical_terms = [
        "python", "java", "sql", "api", "database", "model",
        "machine learning", "ai", "algorithm", "testing",
        "debug", "frontend", "backend", "react", "fastapi",
        "project", "developed", "implemented", "built",
        "designed", "team", "problem", "solution", "result"
    ]

    matched_terms = [
        term for term in technical_terms
        if term in answer.lower()
    ]

    score += min(2, len(matched_terms) * 0.5)

    if any(word in answer.lower() for word in [
        "because", "for example", "such as", "therefore",
        "first", "then", "finally", "result"
    ]):
        score += 1
        feedback_points.append("Good use of explanation or examples.")

    # Check whether the answer has some connection to the question.
    question_words = {
        word for word in re.findall(r"\b[a-zA-Z]{4,}\b", question.lower())
        if word not in {"your", "about", "what", "tell", "have", "with"}
    }
    answer_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", answer.lower()))
    relevant_words = question_words.intersection(answer_words)

    if relevant_words:
        score += 1

    # Resume alignment is a small supporting factor, not the main score.
    resume_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", resume.lower()))
    resume_matches = answer_words.intersection(resume_words)

    if resume_matches:
        score += 0.5

    score = round(min(10, max(0, score)), 1)

    if score >= 8:
        feedback = "Strong answer. It includes useful details. Try to keep your explanation clear and specific."
    elif score >= 5:
        feedback = "Fair answer. Add relevant technical details and a concrete example to improve it."
    else:
        feedback = "Your answer needs more explanation. Describe what you did, how you did it, and the result."

    return {
        "score": score,
        "feedback": feedback,
        "word_count": word_count,
        "matched_technical_terms": matched_terms
    }

def build_final_result(session):
    evaluations = session["evaluations"]

    if evaluations:
        overall_score = round(
            sum(item["score"] for item in evaluations) / len(evaluations), 1
        )
    else:
        overall_score = 0

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
        "question_scores": [
            {
                "question_number": item["question_number"],
                "score": item["score"],
                "feedback": item["feedback"]
            }
            for item in evaluations
        ]
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
    question_number = min(max(request.question_number, 1), TOTAL_QUESTIONS)

    if question_number == 1:
        interview_sessions["current"] = {"evaluations": []}

    return {
        "status": "success",
        "question": questions[question_number - 1],
        "question_number": question_number,
        "total_questions": TOTAL_QUESTIONS,
        "difficulty": "Adaptive"
    }

@router.post("/next")
def next_question(request: InterviewRequest):
    next_number = min(request.question_number + 1, TOTAL_QUESTIONS)

    return {
        "status": "success",
        "question": questions[next_number - 1],
        "question_number": next_number,
        "total_questions": TOTAL_QUESTIONS,
        "difficulty": "Adaptive"
    }

@router.post("/answer")
def submit_answer(request: AnswerRequest):
    current_number = min(max(request.question_number, 1), TOTAL_QUESTIONS)

    evaluation = evaluate_answer(request)

    session = interview_sessions.setdefault(
        "current", {"evaluations": []}
    )

    # Avoid counting the same question more than once.
    session["evaluations"] = [
        item for item in session["evaluations"]
        if item["question_number"] != current_number
    ]

    session["evaluations"].append({
        "question_number": current_number,
        "score": evaluation["score"],
        "feedback": evaluation["feedback"]
    })

    if current_number >= TOTAL_QUESTIONS:
        result = build_final_result(session)

        return {
            "status": "success",
            "finished": True,
            "completed": True,
            "evaluation": evaluation,
            "result": result
        }

    next_number = current_number + 1

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
