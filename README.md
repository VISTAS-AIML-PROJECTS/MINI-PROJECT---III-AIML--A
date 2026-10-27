# CARA – Multi-Agent Career Readiness Framework

CARA is an AI-powered career readiness framework designed to help users evaluate their career preparedness through resume analysis, ATS matching, skill verification, personalized learning recommendations, mock interviews, and career decision support.

## 🎯 Project Overview

CARA uses specialized AI agents to support different stages of career preparation. The framework aims to provide personalized feedback and help users identify areas for improvement.

## ✨ Key Features

### Six Specialized Agents

1. **Resume Intelligence Agent** – Analyzes resume information to support career profiling.
2. **Explainable ATS Matching Agent** – Evaluates resume alignment with job requirements and helps explain matching results.
3. **Evidence-Based Skill Verification Agent** – Supports skill assessment using available evidence.
4. **Personalized Learning Roadmap Agent** – Helps identify learning areas and organize improvement plans.
5. **CAIA – Adaptive Mock Interview Agent** – Supports interview practice and personalized feedback.
6. **HR Decision Support Agent** – Supports career-readiness assessment and decision-making.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Python, FastAPI
- **AI and NLP:** DistilBERT, Natural Language Processing, Cosine Similarity
- **Generative AI:** Gemini API
- **Version Control:** Git and GitHub

## 🏗️ Project Structure

```text
CARA-Multi-Agent-Career-Readiness/
├── backend/
│   ├── agent5.py
│   ├── agent5Backend.py
│   ├── agent5_server.py
│   ├── main.py
│   ├── main_agent6.py
│   └── resume_parser.py
├── cara-frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── package.json
└── package-lock.json
```

## 🚀 Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git
- A Gemini API key for features that use the Gemini API

### 1. Clone the Repository

```bash
git clone https://github.com/nancysheela391-svg/CARA-Multi-Agent-Career-Readiness-.git
cd CARA-Multi-Agent-Career-Readiness-
```

### 2. Set Up the Frontend

```bash
cd cara-frontend
npm install
npm run dev
```

Open the local URL displayed in your terminal to access the frontend.

### 3. Configure the Backend

Install the Python dependencies required by the backend modules and configure the backend environment before starting the server.

Set your Gemini API key using the `GEMINI_API_KEY` environment variable when required. Never commit API keys, passwords, or `.env` files to GitHub.

Refer to the backend source files for the relevant server entry point and configuration.

## 🔐 Security

- Keep API keys and credentials private.
- Do not upload personal resumes or other sensitive user data.
- Store secrets in environment variables rather than directly in source code.

## 🎓 Project Goals

- Improve career-readiness assessment.
- Support resume and job-description analysis.
- Provide personalized learning guidance.
- Enable adaptive mock interview practice.
- Assist career-related decision-making.

## 🔮 Future Improvements

- Further integration and coordination of all six agents.
- Enhanced evaluation and testing of agent outputs.
- Improved dashboards and reporting.
- More comprehensive setup and deployment documentation.

## 👩‍💻 Repository

**GitHub:** [CARA – Multi-Agent Career Readiness Framework](https://github.com/nancysheela391-svg/CARA-Multi-Agent-Career-Readiness-)

---

*An AI-driven framework for personalized career preparation and readiness assessment.*
