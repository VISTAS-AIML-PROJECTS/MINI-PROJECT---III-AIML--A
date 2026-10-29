# ==================================================
# AGENT 06 - HR DECISION SUPPORT
# ==================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request Model
# --------------------------------------------------

class Agent6Request(BaseModel):
    scores: dict = {}


# --------------------------------------------------
# Agent 6 HR Decision Support
# --------------------------------------------------

@app.post("/api/agent6/score")
def agent6_score(request: Agent6Request):

    scores = request.scores

    agent1 = float(
        scores.get("agent1", scores.get("1", 0)) or 0
    )

    agent2 = float(
        scores.get("agent2", scores.get("2", 0)) or 0
    )

    agent3 = float(
        scores.get("agent3", scores.get("3", 0)) or 0
    )

    agent5 = float(
        scores.get("agent5", scores.get("5", 0)) or 0
    )

    # Keep scores between 0 and 100
    agent1 = max(0, min(agent1, 100))
    agent2 = max(0, min(agent2, 100))
    agent3 = max(0, min(agent3, 100))
    agent5 = max(0, min(agent5, 100))


    # --------------------------------------------------
    # Career Readiness Score
    # --------------------------------------------------

    career_readiness_score = round(
        (agent1 + agent2 + agent3 + agent5) / 4
    )


    # --------------------------------------------------
    # HR Decision
    # --------------------------------------------------

    if career_readiness_score >= 80:

        hr_decision = "Strongly Recommended"

        recommendation = (
            "The candidate demonstrates strong overall "
            "career readiness across the evaluated areas."
        )

    elif career_readiness_score >= 65:

        hr_decision = "Recommended"

        recommendation = (
            "The candidate demonstrates good career readiness "
            "with some areas that can still be strengthened."
        )

    elif career_readiness_score >= 50:

        hr_decision = "Consider"

        recommendation = (
            "The candidate shows moderate readiness. "
            "Further skill development and evaluation are recommended."
        )

    else:

        hr_decision = "Needs Development"

        recommendation = (
            "The candidate should strengthen key skills "
            "and competencies before being considered fully job-ready."
        )


    # --------------------------------------------------
    # Strengths
    # --------------------------------------------------

    strengths = []

    if agent1 >= 70:
        strengths.append("Strong career profile")

    if agent2 >= 70:
        strengths.append("Good ATS and skills alignment")

    if agent3 >= 70:
        strengths.append(
            "Strong evidence-based skill verification"
        )

    if agent5 >= 70:
        strengths.append("Good interview readiness")

    if not strengths:

        strengths.append(
            "The candidate has areas of potential "
            "that can be developed."
        )


    # --------------------------------------------------
    # Weaknesses
    # --------------------------------------------------

    weaknesses = []

    if agent1 < 60:
        weaknesses.append(
            "Career profile needs improvement"
        )

    if agent2 < 60:
        weaknesses.append(
            "ATS and skills alignment needs improvement"
        )

    if agent3 < 60:
        weaknesses.append(
            "Skill evidence needs strengthening"
        )

    if agent5 < 60:
        weaknesses.append(
            "Interview readiness needs improvement"
        )

    if not weaknesses:

        weaknesses.append(
            "No major weakness was identified "
            "from the available scores."
        )


    # --------------------------------------------------
    # Development Priorities
    # --------------------------------------------------

    development_priorities = []

    if agent1 < 70:

        development_priorities.append(
            "Strengthen career profile and resume presentation"
        )

    if agent2 < 70:

        development_priorities.append(
            "Improve job-skill alignment"
        )

    if agent3 < 70:

        development_priorities.append(
            "Provide stronger evidence for claimed skills"
        )

    if agent5 < 70:

        development_priorities.append(
            "Improve mock interview performance"
        )

    if not development_priorities:

        development_priorities.append(
            "Continue strengthening advanced professional skills"
        )


    # --------------------------------------------------
    # Final Response
    # --------------------------------------------------

    return {

        "message":
            "Agent 6 HR analysis completed successfully!",

        "career_readiness_score":
            career_readiness_score,

        "hr_decision":
            hr_decision,

        "recommendation":
            recommendation,

        "strengths":
            strengths,

        "weaknesses":
            weaknesses,

        "development_priorities":
            development_priorities,

        "agent_scores": {

            "agent1":
                agent1,

            "agent2":
                agent2,

            "agent3":
                agent3,

            "agent5":
                agent5
        }
    }


# --------------------------------------------------
# Run Agent 6 Backend
# --------------------------------------------------

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8006
    )