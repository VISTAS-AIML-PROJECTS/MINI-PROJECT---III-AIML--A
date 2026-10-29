import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Gemini configuration
# --------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None


# --------------------------------------------------
# Interview session
# --------------------------------------------------

interview_session = {
    "questions": [],
    "answers": [],
    "evaluations": [],
    "profile": {},
    "resume_text": ""
}

TOTAL_QUESTIONS = 10


# --------------------------------------------------
# Difficulty
# --------------------------------------------------

def get_difficulty(question_number):
    if question_number <= 3:
        return "easy"
    elif question_number <= 7:
        return "medium"
    else:
        return "hard"


# --------------------------------------------------
# Gemini helper
# --------------------------------------------------

def ask_gemini(prompt):

    if not client:
        raise Exception("Gemini API key is not configured.")

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={
            "temperature": 0.5,
            "response_mime_type": "application/json"
        }
    )

    text = response.text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    return json.loads(text)


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.route("/api/agent5/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "agent": "Agent 5",
        "message": "Context-Aware Adaptive Mock Interview Agent is running"
    })


# --------------------------------------------------
# Start interview
# --------------------------------------------------

@app.route("/api/agent5/start", methods=["POST"])
def start_interview():

    try:

        data = request.get_json() or {}

        profile = data.get("profile", {})
        resume_text = data.get("resume_text", "")
        role = data.get("role", "Software Engineer")

        interview_session["questions"] = []
        interview_session["answers"] = []
        interview_session["evaluations"] = []
        interview_session["profile"] = profile
        interview_session["resume_text"] = resume_text

        prompt = f"""
You are Agent 5 of CARA, an AI-powered adaptive mock interview system.

Conduct a professional technical and HR-style interview.

Candidate role:
{role}

Candidate profile:
{json.dumps(profile)}

Resume:
{resume_text}

Generate ONLY the first interview question.

Question number: 1
Difficulty: easy

The candidate is a fresher or early-career candidate.

The question should be professional and easy to answer.

Return ONLY valid JSON:

{{
    "question": "your interview question here"
}}
"""

        result = ask_gemini(prompt)

        question = result.get(
            "question",
            "Tell me about yourself and your technical background."
        )

        interview_session["questions"].append(question)

        return jsonify({
            "question": question,
            "question_number": 1,
            "total_questions": TOTAL_QUESTIONS,
            "difficulty": "easy"
        })

    except Exception as e:

        print("START INTERVIEW ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Submit answer
# --------------------------------------------------

@app.route("/api/agent5/answer", methods=["POST"])
def submit_answer():

    try:

        data = request.get_json() or {}

        question = data.get("question", "")
        answer = data.get("answer", "")
        question_number = int(
            data.get("question_number", 1)
        )

        profile = data.get(
            "profile",
            interview_session.get("profile", {})
        )

        resume_text = data.get(
            "resume_text",
            interview_session.get("resume_text", "")
        )

        role = data.get(
            "role",
            "Software Engineer"
        )

        interview_session["answers"].append(answer)

        # --------------------------------------------------
        # Question 10 = final result
        # --------------------------------------------------

        if question_number >= TOTAL_QUESTIONS:

            final_prompt = f"""
You are the final evaluator for CARA Agent 5.

The candidate completed a 10-question adaptive interview.

Candidate role:
{role}

Candidate profile:
{json.dumps(profile)}

Resume:
{resume_text}

Interview questions:
{json.dumps(interview_session["questions"])}

Candidate answers:
{json.dumps(interview_session["answers"])}

Evaluate the complete interview.

Give an overall score from 0 to 10.

Identify:

1. Strengths
2. Weaknesses
3. Areas to improve
4. Practical improvement plan
5. Professional overall feedback

Return ONLY valid JSON:

{{
    "overall_score": 8.0,
    "strengths": [
        "strength 1",
        "strength 2"
    ],
    "weaknesses": [
        "weakness 1",
        "weakness 2"
    ],
    "improvements": [
        "improvement 1",
        "improvement 2"
    ],
    "feedback": "Overall professional feedback."
}}
"""

            final_result = ask_gemini(final_prompt)

            return jsonify({
                "finished": True,
                "completed": True,
                "result": final_result
            })

        # --------------------------------------------------
        # Evaluate answer
        # --------------------------------------------------

        difficulty = get_difficulty(question_number)

        evaluation_prompt = f"""
You are the internal evaluation engine of CARA Agent 5.

Evaluate the candidate's answer only for deciding
what topic the next interview question should focus on.

Question:
{question}

Candidate answer:
{answer}

Current difficulty:
{difficulty}

Return ONLY valid JSON:

{{
    "performance": "good",
    "topic_to_focus": "technical skills",
    "reason": "short internal reason"
}}

Do not give candidate feedback.
"""

        evaluation = ask_gemini(evaluation_prompt)

        interview_session["evaluations"].append(evaluation)

        # --------------------------------------------------
        # Generate next question
        # --------------------------------------------------

        next_question_number = question_number + 1
        next_difficulty = get_difficulty(
            next_question_number
        )

        previous_questions = interview_session["questions"]

        next_prompt = f"""
You are CARA Agent 5, an adaptive AI interviewer.

Generate the next interview question.

Candidate role:
{role}

Candidate profile:
{json.dumps(profile)}

Resume:
{resume_text}

Previous questions:
{json.dumps(previous_questions)}

Previous candidate answers:
{json.dumps(interview_session["answers"])}

Latest internal evaluation:
{json.dumps(evaluation)}

Next question number:
{next_question_number}

Required difficulty:
{next_difficulty}

Rules:

- The interview has exactly 10 questions.
- Never generate question 11.
- Questions 1-3 are easy.
- Questions 4-7 are medium.
- Questions 8-10 are hard or slightly technical.
- Adapt the topic based on the candidate's previous answer.
- Do not repeat previous questions.
- Mix technical and HR/career questions.
- Keep the question professional.
- Suitable for a fresher or early-career candidate.

Return ONLY valid JSON:

{{
    "question": "your next interview question here"
}}
"""

        result = ask_gemini(next_prompt)

        next_question = result.get(
            "question",
            "Can you explain one technical project you have worked on?"
        )

        interview_session["questions"].append(
            next_question
        )

        # IMPORTANT:
        # Return "question" because the frontend expects it.

        return jsonify({
            "finished": False,
            "completed": False,
            "question": next_question,
            "question_number": next_question_number,
            "total_questions": TOTAL_QUESTIONS,
            "difficulty": next_difficulty
        })

    except Exception as e:

        print("ANSWER ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Run server
# --------------------------------------------------

if __name__ == "__main__":

    print("======================================")
    print("CARA Agent 5 Backend")
    print("Gemini model:", GEMINI_MODEL)

    print(
        "Gemini API key:",
        "FOUND" if GEMINI_API_KEY else "NOT FOUND"
    )

    print("Server: http://localhost:8005")
    print("======================================")

    app.run(
        host="0.0.0.0",
        port=8005,
        debug=True
    )