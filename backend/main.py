from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import re

# DistilBERT
import torch
from transformers import AutoTokenizer, AutoModel

# Cosine Similarity
from sklearn.metrics.pairwise import cosine_similarity

# Resume parser
from resume_parser import analyze_resume


app = FastAPI()


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# LOAD DISTILBERT
# --------------------------------------------------

print("Loading DistilBERT model...")

tokenizer = AutoTokenizer.from_pretrained(
    "distilbert-base-uncased"
)

model = AutoModel.from_pretrained(
    "distilbert-base-uncased"
)

model.eval()

print("DistilBERT model loaded successfully!")


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "CARA Backend is Running!"
    }


# --------------------------------------------------
# AGENT 01 - RESUME ANALYSIS
# --------------------------------------------------

@app.post("/analyze-resume")
async def analyze_resume_api(
    file: UploadFile = File(...)
):

    os.makedirs("uploads", exist_ok=True)

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    result = analyze_resume(file_path)

    return {
        "message": "Resume analyzed successfully!",
        "filename": file.filename,
        "skills": result["skills"],
        "sections": result["sections"]
    }


# --------------------------------------------------
# DISTILBERT SEMANTIC ENCODING
# --------------------------------------------------

def get_distilbert_embedding(text):

    text = text[:5000]

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512
    )

    with torch.no_grad():
        outputs = model(**inputs)

    token_embeddings = outputs.last_hidden_state

    attention_mask = inputs["attention_mask"]

    mask = attention_mask.unsqueeze(-1).expand(
        token_embeddings.size()
    ).float()

    summed = torch.sum(
        token_embeddings * mask,
        dim=1
    )

    summed_mask = torch.clamp(
        mask.sum(dim=1),
        min=1e-9
    )

    embedding = summed / summed_mask

    return embedding.numpy()


# ==================================================
# AGENT 02 - EXPLAINABLE ATS MATCHING
# ==================================================

class ATSRequest(BaseModel):

    resume_text: str
    job_description: str


@app.post("/analyze-ats")
def analyze_ats(request: ATSRequest):

    resume_text = request.resume_text
    job_description = request.job_description

    resume_embedding = get_distilbert_embedding(
        resume_text
    )

    job_embedding = get_distilbert_embedding(
        job_description
    )

    semantic_similarity = cosine_similarity(
        resume_embedding,
        job_embedding
    )[0][0]

    semantic_score = round(
        float(semantic_similarity) * 100
    )

    resume_lower = resume_text.lower()
    job_lower = job_description.lower()

    skills = [
        "Python",
        "Java",
        "JavaScript",
        "React",
        "HTML",
        "CSS",
        "SQL",
        "Machine Learning",
        "Deep Learning",
        "Artificial Intelligence",
        "NLP",
        "Data Analysis",
        "Git",
        "GitHub",
        "FastAPI",
        "Flask",
        "Django",
        "MySQL",
        "MongoDB",
        "Docker",
        "AWS",
        "TensorFlow",
        "PyTorch",
        "Pandas",
        "NumPy",
        "Scikit-learn"
    ]

    required_skills = [
        skill
        for skill in skills
        if skill.lower() in job_lower
    ]

    matched_skills = [
        skill
        for skill in required_skills
        if skill.lower() in resume_lower
    ]

    missing_skills = [
        skill
        for skill in required_skills
        if skill.lower() not in resume_lower
    ]

    if len(required_skills) > 0:

        skill_score = round(
            (
                len(matched_skills)
                / len(required_skills)
            ) * 100
        )

    else:

        skill_score = 0

    if required_skills:

        final_score = round(
            (semantic_score * 0.60)
            +
            (skill_score * 0.40)
        )

    else:

        final_score = semantic_score

    if final_score >= 80:

        explanation = (
            "Excellent match. The resume is strongly "
            "aligned with the job description both "
            "semantically and in terms of required skills."
        )

    elif final_score >= 60:

        explanation = (
            "Good match. The resume shows reasonable "
            "semantic alignment and contains several "
            "relevant skills."
        )

    elif final_score >= 40:

        explanation = (
            "Moderate match. Some relevant information "
            "is present, but important skills or "
            "job-related information may be missing."
        )

    else:

        explanation = (
            "Low match. The resume has limited semantic "
            "and skill alignment with the job description."
        )

    suggestions = []

    if missing_skills:

        suggestions.append(
            "Consider developing or demonstrating "
            "the missing skills: "
            + ", ".join(missing_skills)
        )

    if semantic_score < 60:

        suggestions.append(
            "Improve the relevance of your resume "
            "content to better match the job description."
        )

    if skill_score < 60:

        suggestions.append(
            "Highlight more of the skills required "
            "for this position."
        )

    if not suggestions:

        suggestions.append(
            "Your resume is well aligned with this "
            "job description. Continue strengthening "
            "your projects and measurable achievements."
        )

    return {

        "message":
            "ATS analysis completed successfully!",

        "ats_score":
            final_score,

        "semantic_score":
            semantic_score,

        "skill_score":
            skill_score,

        "required_skills":
            required_skills,

        "matched_skills":
            matched_skills,

        "missing_skills":
            missing_skills,

        "explanation":
            explanation,

        "suggestions":
            suggestions
    }


# ==================================================
# AGENT 03 - SKILL VERIFICATION
# ==================================================

class SkillVerificationRequest(BaseModel):

    resume_text: str
    skills: list[str]


def split_into_sentences(text):

    sentences = re.split(
        r'(?<=[.!?])\s+',
        text
    )

    return [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]


@app.post("/verify-skills")
def verify_skills(
    request: SkillVerificationRequest
):

    resume_text = request.resume_text

    skills = request.skills

    sentences = split_into_sentences(
        resume_text
    )

    results = []


    # Evidence-related action words
    evidence_keywords = [

        "developed",
        "built",
        "created",
        "implemented",
        "designed",
        "worked",
        "used",
        "applied",
        "trained",
        "analyzed",
        "managed",
        "completed",
        "improved",
        "deployed",
        "performed"

    ]


    for skill in skills:

        skill_lower = skill.lower()

        evidence_sentences = []

        for sentence in sentences:

            sentence_lower = sentence.lower()

            # Find sentences containing the skill
            if skill_lower in sentence_lower:

                # Check whether the sentence contains
                # evidence/action words
                has_evidence = any(
                    keyword in sentence_lower
                    for keyword in evidence_keywords
                )

                if has_evidence:

                    evidence_sentences.append(
                        sentence
                    )


        # ----------------------------------------------
        # VERIFICATION STATUS
        # ----------------------------------------------

        if len(evidence_sentences) >= 2:

            status = "Verified"
            score = 100

        elif len(evidence_sentences) == 1:

            status = "Partially Verified"
            score = 70

        else:

            # Check whether the skill is simply mentioned
            if skill_lower in resume_text.lower():

                status = "Claimed Only"
                score = 40

            else:

                status = "Not Verified"
                score = 0


        results.append({

            "skill": skill,

            "status": status,

            "verification_score": score,

            "evidence":
                evidence_sentences

        })


    # ----------------------------------------------
    # OVERALL SCORE
    # ----------------------------------------------

    if len(results) > 0:

        overall_score = round(
            sum(
                item["verification_score"]
                for item in results
            )
            / len(results)
        )

    else:

        overall_score = 0


    # ----------------------------------------------
    # SUMMARY
    # ----------------------------------------------

    verified_count = sum(
        1
        for item in results
        if item["status"] == "Verified"
    )

    partial_count = sum(
        1
        for item in results
        if item["status"] == "Partially Verified"
    )

    claimed_count = sum(
        1
        for item in results
        if item["status"] == "Claimed Only"
    )

    not_verified_count = sum(
        1
        for item in results
        if item["status"] == "Not Verified"
    )


    return {

        "message":
            "Skill verification completed successfully!",

        "overall_verification_score":
            overall_score,

        "verified_count":
            verified_count,

        "partially_verified_count":
            partial_count,

        "claimed_only_count":
            claimed_count,

        "not_verified_count":
            not_verified_count,

        "results":
            results
    }
# ==================================================
# AGENT 04 - PERSONALIZED LEARNING ROADMAP
# ==================================================

class RoadmapRequest(BaseModel):

    resume_text: str
    target_role: str


@app.post("/generate-roadmap")
def generate_roadmap(
    request: RoadmapRequest
):

    resume_text = request.resume_text.lower()
    target_role = request.target_role.lower()


    # ==============================================
    # PYTHON DEVELOPER
    # ==============================================

    if (
        "python" in target_role
        or "backend developer" in target_role
    ):

        career = "Python Developer"

        required_skills = [
            "Python",
            "Data Structures",
            "OOP",
            "SQL",
            "Git",
            "FastAPI",
            "Django",
            "Flask"
        ]

        beginner = [
            "Learn Python syntax and programming fundamentals",
            "Understand variables, loops and functions",
            "Learn Object-Oriented Programming",
            "Practice Data Structures and problem solving"
        ]

        intermediate = [
            "Learn SQL and database fundamentals",
            "Build REST APIs using FastAPI or Flask",
            "Learn Django for web development",
            "Use Git and GitHub for version control"
        ]

        advanced = [
            "Build scalable backend applications",
            "Learn authentication and security",
            "Deploy applications to cloud platforms",
            "Build production-level Python projects"
        ]

        projects = [
            "Student Management System",
            "REST API using FastAPI",
            "Python Web Application"
        ]


    # ==============================================
    # AI / MACHINE LEARNING ENGINEER
    # ==============================================

    elif (
        "ai" in target_role
        or "machine learning" in target_role
        or "ml engineer" in target_role
        or "artificial intelligence" in target_role
    ):

        career = "AI / Machine Learning Engineer"

        required_skills = [
            "Python",
            "Machine Learning",
            "Deep Learning",
            "TensorFlow",
            "PyTorch",
            "NLP",
            "Pandas",
            "NumPy"
        ]

        beginner = [
            "Learn Python programming",
            "Understand mathematics and statistics",
            "Learn NumPy and Pandas",
            "Understand Machine Learning fundamentals"
        ]

        intermediate = [
            "Learn supervised and unsupervised learning",
            "Build Machine Learning models",
            "Learn TensorFlow or PyTorch",
            "Study model evaluation techniques"
        ]

        advanced = [
            "Learn Deep Learning architectures",
            "Study Natural Language Processing",
            "Build advanced AI applications",
            "Deploy Machine Learning models"
        ]

        projects = [
            "Resume Classification System",
            "Career Recommendation System",
            "Machine Learning Prediction Model"
        ]


    # ==============================================
    # PHOTOGRAPHER
    # ==============================================

    elif (
        "photographer" in target_role
        or "photography" in target_role
    ):

        career = "Professional Photographer"

        required_skills = [
            "Camera Fundamentals",
            "Composition",
            "Lighting",
            "Photo Editing",
            "Adobe Lightroom",
            "Photoshop",
            "Portfolio Development",
            "Client Management"
        ]

        beginner = [
            "Learn camera controls and exposure settings",
            "Understand aperture, shutter speed and ISO",
            "Learn photography composition techniques",
            "Practice portrait and outdoor photography"
        ]

        intermediate = [
            "Learn professional lighting techniques",
            "Develop photo editing skills",
            "Learn Adobe Lightroom",
            "Practice different photography styles"
        ]

        advanced = [
            "Learn advanced Photoshop editing",
            "Build a professional photography portfolio",
            "Develop a personal photography style",
            "Learn photography business management"
        ]

        projects = [
            "Portrait Photography Portfolio",
            "Event Photography Project",
            "Professional Photo Editing Collection"
        ]


    # ==============================================
    # UI / UX DESIGNER
    # ==============================================

    elif (
        "ui" in target_role
        or "ux" in target_role
        or "designer" in target_role
    ):

        career = "UI/UX Designer"

        required_skills = [
            "Figma",
            "Design Principles",
            "Wireframing",
            "Prototyping",
            "User Research",
            "User Testing",
            "Visual Design",
            "Portfolio"
        ]

        beginner = [
            "Learn UI and UX fundamentals",
            "Understand design principles",
            "Learn Figma basics",
            "Practice creating wireframes"
        ]

        intermediate = [
            "Create interactive prototypes",
            "Learn user research techniques",
            "Understand user journeys",
            "Practice usability testing"
        ]

        advanced = [
            "Create complete product designs",
            "Build a professional portfolio",
            "Learn design systems",
            "Study advanced UX strategy"
        ]

        projects = [
            "Mobile App UI Design",
            "E-Commerce Website Design",
            "Complete UX Case Study"
        ]


    # ==============================================
    # WEB DEVELOPER
    # ==============================================

    elif (
        "web" in target_role
        or "frontend" in target_role
        or "full stack" in target_role
    ):

        career = "Web Developer"

        required_skills = [
            "HTML",
            "CSS",
            "JavaScript",
            "React",
            "Git",
            "GitHub",
            "Node.js",
            "SQL"
        ]

        beginner = [
            "Learn HTML and CSS",
            "Understand JavaScript fundamentals",
            "Practice responsive web design",
            "Learn Git and GitHub"
        ]

        intermediate = [
            "Learn React",
            "Build interactive web applications",
            "Understand APIs",
            "Learn backend fundamentals"
        ]

        advanced = [
            "Build full-stack applications",
            "Learn application deployment",
            "Improve web performance",
            "Build production-level projects"
        ]

        projects = [
            "Personal Portfolio Website",
            "E-Commerce Website",
            "Full-Stack Web Application"
        ]


    # ==============================================
    # DATA ANALYST
    # ==============================================

    elif (
        "data analyst" in target_role
        or "data analysis" in target_role
    ):

        career = "Data Analyst"

        required_skills = [
            "Python",
            "SQL",
            "Excel",
            "Pandas",
            "Data Visualization",
            "Power BI",
            "Tableau",
            "Statistics"
        ]

        beginner = [
            "Learn Excel for data analysis",
            "Understand basic statistics",
            "Learn SQL fundamentals",
            "Learn Python basics"
        ]

        intermediate = [
            "Learn Pandas for data analysis",
            "Practice data cleaning",
            "Create data visualizations",
            "Learn Power BI or Tableau"
        ]

        advanced = [
            "Perform advanced data analysis",
            "Create interactive dashboards",
            "Build complete analytics projects",
            "Learn business data storytelling"
        ]

        projects = [
            "Sales Data Dashboard",
            "Customer Analysis Project",
            "Business Intelligence Dashboard"
        ]


    # ==============================================
    # CYBERSECURITY
    # ==============================================

    elif (
        "cyber" in target_role
        or "security" in target_role
    ):

        career = "Cybersecurity Professional"

        required_skills = [
            "Networking",
            "Linux",
            "Cybersecurity Fundamentals",
            "Ethical Hacking",
            "Python",
            "Cryptography",
            "Web Security",
            "Security Tools"
        ]

        beginner = [
            "Learn networking fundamentals",
            "Understand Linux basics",
            "Study cybersecurity principles",
            "Learn basic Python scripting"
        ]

        intermediate = [
            "Learn web security concepts",
            "Study ethical hacking fundamentals",
            "Understand common cyber attacks",
            "Practice using security tools"
        ]

        advanced = [
            "Learn advanced penetration testing",
            "Study cloud security",
            "Learn incident response",
            "Build cybersecurity projects"
        ]

        projects = [
            "Network Security Analysis",
            "Security Vulnerability Scanner",
            "Cybersecurity Portfolio Project"
        ]


    # ==============================================
    # GENERAL CAREER FALLBACK
    # ==============================================

    else:

        career = request.target_role

        required_skills = [
            "Domain Knowledge",
            "Communication",
            "Problem Solving",
            "Professional Skills",
            "Portfolio Development"
        ]

        beginner = [
            f"Learn the fundamental concepts of {career}",
            "Build strong foundational knowledge",
            "Develop essential communication skills",
            "Practice basic professional skills"
        ]

        intermediate = [
            f"Develop practical skills related to {career}",
            "Learn important industry tools",
            "Work on practical projects",
            "Gain real-world experience"
        ]

        advanced = [
            "Develop advanced professional expertise",
            "Build a strong professional portfolio",
            "Work on complex projects",
            "Prepare for industry opportunities"
        ]

        projects = [
            f"{career} Beginner Project",
            f"{career} Practical Project",
            f"{career} Portfolio Project"
        ]


    # ==============================================
    # RESUME SKILL GAP ANALYSIS
    # ==============================================

    existing_skills = [

        skill

        for skill in required_skills

        if skill.lower() in resume_text

    ]


    missing_skills = [

        skill

        for skill in required_skills

        if skill.lower() not in resume_text

    ]


    # ==============================================
    # ROADMAP RESPONSE
    # ==============================================

    return {

        "message":
            "Personalized learning roadmap generated successfully!",

        "target_role":
            career,

        "skills_found":
            existing_skills,

        "skills_to_develop":
            missing_skills,

        "beginner":
            beginner,

        "intermediate":
            intermediate,

        "advanced":
            advanced,

        "projects":
            projects
    }
from agent5 import router as agent5_router
app.include_router(agent5_router, prefix='/api/agent5')
