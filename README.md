# CARA — Multi-Agent Career Readiness Framework

### A GenAI-Powered Career Readiness Assistant with Adaptive Mock Interviews

CARA is an AI-powered career readiness framework designed to help candidates evaluate their career preparedness through resume analysis, explainable ATS matching, skill verification, personalized learning recommendations, adaptive mock interviews, and HR decision support.

The framework integrates six specialized agents into a unified workflow to provide structured, personalized, and evidence-based career readiness insights.

## 🎯 Project Objectives

- Analyze resumes and identify relevant skills and qualifications.
- Evaluate resume compatibility with target job descriptions.
- Verify skills using available evidence.
- Generate personalized learning roadmaps.
- Conduct context-aware adaptive mock interviews.
- Provide structured HR decision-support insights.

## 🤖 System Architecture — Six Specialized Agents

| Agent | Module | Weight |
|---|---|---:|
| Agent 1 | Resume Intelligence | 10% |
| Agent 2 | Explainable ATS Matching | 20% |
| Agent 3 | Evidence-Based Skill Verification | 15% |
| Agent 4 | Personalized Learning Roadmap | 15% |
| Agent 5 | CAIA — Context-Aware Adaptive Mock Interview | 20% |
| Agent 6 | HR Decision Support | 20% |
| | **Total** | **100%** |

The framework combines the outputs of its specialized agents to calculate an overall readiness score using a weighted evaluation approach.

## ✨ Key Features

- **Resume Intelligence:** Extracts and analyzes relevant information from candidate resumes.
- **Explainable ATS Matching:** Evaluates the alignment between candidate profiles and job requirements.
- **Skill Verification:** Assesses skills using available candidate evidence.
- **Personalized Learning Roadmap:** Recommends learning priorities based on identified skill gaps.
- **Adaptive Mock Interviews:** Generates role-relevant interview questions and evaluates candidate responses using contextual information.
- **HR Decision Support:** Consolidates readiness insights to support structured candidate evaluation.
- **Integrated Web Interface:** Provides a unified interface for interacting with the framework's modules.

## 🛠️ Technology Stack

**Frontend**
- React
- Vite
- JavaScript and JSX

**Backend**
- Python
- FastAPI
- REST APIs

**AI and NLP**
- Generative AI integration using the Gemini API
- DistilBERT
- Natural Language Processing (NLP)
- Cosine Similarity

**Development Tools**
- Git and GitHub
- Node.js and npm
- Python virtual environment
- Uvicorn

**Database**
- MySQL (planned integration, if not yet implemented)

## 🏗️ Project Structure

```text
MINI-PROJECT---III-AIML--A/
├── backend/
│   ├── main.py
│   ├── agent5.py
│   ├── agent5Backend.py
│   ├── agent5_server.py
│   ├── main_agent6.py
│   ├── resume_parser.py
│   └── uploads/
├── public/
├── src/
├── DOCUMENTATION/
├── PAPER/
├── PPT/
├── package.json
├── package-lock.json
├── vite.config.js
├── index.html
├── .gitignore
├── README.md
└── CARA_Complete_Mini_Project_Report_updated_v2.docx
```

*Note: This structure highlights the main project directories and selected files. Individual files may vary as the project evolves.*

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.10 or a compatible version supported by the backend dependencies
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/AIML2026-27/MINI-PROJECT---III-AIML--A.git
cd MINI-PROJECT---III-AIML--A
```

### 2. Set Up the Backend

Open a terminal in the repository root:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

If the backend does not contain a `requirements.txt` file, install the dependencies listed in your project's actual dependency configuration before proceeding.

Start the backend using the entry point configured for your project. For example, if `main.py` exposes the FastAPI application as `app`:

```bash
uvicorn main:app --reload
```

### 3. Set Up the Frontend

Open a second terminal in the repository root:

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite in the terminal, typically:

```text
http://localhost:5173
```

**Configuration note:** Set the required Gemini API key and other secrets using environment variables or a local environment file excluded from Git. Never commit API keys, passwords, or private credentials.

Check the actual backend entry point, dependency files, and environment-variable names before running these commands.

## 🔄 System Workflow

1. The candidate provides a resume and relevant career information.
2. The resume intelligence module extracts candidate details.
3. ATS matching evaluates alignment with the target role.
4. Skill verification identifies supported skills and potential gaps.
5. The learning roadmap recommends improvement priorities.
6. The adaptive mock interview evaluates candidate responses.
7. HR decision support consolidates the available assessment results.
8. The framework presents career readiness insights to the candidate.

## 🎓 Project Scope

CARA is designed as a modular career readiness framework that can be adapted to different professional roles. Its purpose is to support candidate preparation and structured evaluation, rather than replace human judgement in recruitment decisions.

The reliability of its outputs depends on the quality of the supplied information, the implemented assessment logic, and the configuration of the connected AI services.

## 📁 Project Resources

- **Source Code:** Available in this repository.
- **Project Report:** Available in the `DOCUMENTATION/` directory.
- **Presentation:** Available in the `PPT/` directory.
- **Conference Paper:** Available in the `PAPER/` directory.

## 🚀 Future Enhancements

- Complete database integration and persistent candidate profiles.
- Expand role-specific interview question generation.
- Improve assessment transparency and feedback quality.
- Add comprehensive testing, validation, and performance monitoring.
- Enhance deployment, security, and scalability.

## 👩‍💻 Contributors

Developed as an academic mini-project by the project team.

## 📄 License

No license has been specified for this repository. All rights are reserved by the respective authors unless a license is added.
