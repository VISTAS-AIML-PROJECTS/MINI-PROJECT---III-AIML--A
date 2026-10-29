import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function ResumeAgent({ onBack, onComplete }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const skillList = [
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
    "Scikit-learn",
  ];

  const analyzeResume = (text) => {
    const lowerText = text.toLowerCase();

    const skills = skillList.filter((skill) =>
      lowerText.includes(skill.toLowerCase())
    );

    const sections = {
      education:
        /education|university|college|b\.tech|bachelor|degree|school/i.test(
          text
        ),

      experience:
        /experience|internship|intern|worked|employment|developer|engineer/i.test(
          text
        ),

      projects:
        /projects|project|developed|built|created|implemented/i.test(text),

      certifications:
        /certification|certificate|certified|course|training/i.test(text),
    };

    let score = 40;

    if (skills.length >= 3) score += 10;
    if (skills.length >= 6) score += 10;
    if (sections.education) score += 10;
    if (sections.experience) score += 10;
    if (sections.projects) score += 10;
    if (sections.certifications) score += 10;

    score = Math.min(score, 100);

    const suggestions = [];

    if (!sections.experience) {
      suggestions.push(
        "Add internship or work experience if available."
      );
    }

    if (!sections.projects) {
      suggestions.push(
        "Add 2–3 relevant projects to strengthen your profile."
      );
    }

    if (!sections.certifications) {
      suggestions.push(
        "Add relevant certifications or completed courses."
      );
    }

    if (skills.length < 5) {
      suggestions.push(
        "Highlight more relevant technical skills."
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        "Your resume has a good structure. Continue adding measurable achievements."
      );
    }

    return {
      score,
      skills,
      sections,
      suggestions,
    };
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please select a PDF resume.");
      return;
    }

    setResumeFile(file);
    setResumeText("");
    setAnalysis(null);
    setError("");
    setLoading(true);

    try {
      // STEP 1: Read PDF
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

      let fullText = "";

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        const pageText = content.items
          .map((item) => item.str)
          .join(" ");

        fullText += ` ${pageText}`;
      }

      const cleanText = fullText.trim();

      setResumeText(cleanText);

      // STEP 2: Send PDF to backend
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/analyze-resume",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Backend analysis failed");
      }

      const backendResult = await response.json();

      console.log(
        "CARA Backend Result:",
        backendResult
      );

      // STEP 3: Frontend analysis
      const localResult = analyzeResume(cleanText);

      // STEP 4: Combine backend + frontend results
      const finalResult = {
        ...localResult,
        skills:
          backendResult.skills || localResult.skills,
        sections:
          backendResult.sections || localResult.sections,
      };

      setAnalysis(finalResult);

    } catch (err) {
      console.error(err);

      setError(
        "Unable to analyze this resume. Please make sure the CARA backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Continue to Agent 02
  const handleContinue = () => {
    if (!resumeText.trim()) {
      alert("Please upload and analyze your resume first.");
      return;
    }

    if (onComplete) {
      onComplete(resumeText, analysis.score);
    }
  };

  return (
    <div className="agent-page">

      {/* HEADER */}
      <header className="agent-header">

        <div>
          <p className="agent-label">
            AGENT 01
          </p>

          <h1>
            Resume Intelligence Agent
          </h1>

          <p>
            Analyze and understand the candidate's resume
          </p>
        </div>

        <button
          className="back-btn"
          type="button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

      </header>

      <main className="resume-container">

        {/* UPLOAD SECTION */}
        <section className="upload-card">

          <div className="upload-icon">
            📄
          </div>

          <h2>
            Upload Your Resume
          </h2>

          <p>
            Upload your resume to begin CARA's intelligent analysis.
          </p>

          <input
            type="file"
            accept=".pdf,application/pdf"
            id="resume-upload"
            onChange={handleFileChange}
            hidden
          />

          <label
            htmlFor="resume-upload"
            className="upload-btn"
          >
            Choose Resume
          </label>

          <p className="file-note">
            PDF format supported
          </p>

          {resumeFile && (
            <div className="selected-file">
              📄 {resumeFile.name}
            </div>
          )}

          {loading && (
            <p className="processing-message">
              ⏳ CARA is analyzing your resume...
            </p>
          )}

          {error && (
            <p className="error-message">
              ⚠️ {error}
            </p>
          )}

        </section>

        {/* ANALYSIS REPORT */}
        {analysis && (
          <section className="preview-card">

            <h2>
              🧠 Resume Intelligence Report
            </h2>

            <p className="empty-message">
              CARA analyzed the information extracted from your resume.
            </p>

            <div className="preview-grid">

              <div className="preview-item">
                <span>
                  Resume Quality
                </span>

                <strong>
                  {analysis.score}/100
                </strong>
              </div>

              <div className="preview-item">
                <span>
                  Skills Found
                </span>

                <strong>
                  {analysis.skills.length}
                </strong>
              </div>

              <div className="preview-item">
                <span>
                  Projects
                </span>

                <strong>
                  {analysis.sections.projects
                    ? "Found"
                    : "Missing"}
                </strong>
              </div>

              <div className="preview-item">
                <span>
                  Education
                </span>

                <strong>
                  {analysis.sections.education
                    ? "Found"
                    : "Missing"}
                </strong>
              </div>

              <div className="preview-item">
                <span>
                  Experience
                </span>

                <strong>
                  {analysis.sections.experience
                    ? "Found"
                    : "Missing"}
                </strong>
              </div>

              <div className="preview-item">
                <span>
                  Certifications
                </span>

                <strong>
                  {analysis.sections.certifications
                    ? "Found"
                    : "Missing"}
                </strong>
              </div>

            </div>

          </section>
        )}

        {/* SKILLS */}
        {analysis && (
          <section className="preview-card">

            <h2>
              🛠️ Skills Identified
            </h2>

            <div className="skills-list">

              {analysis.skills.length > 0 ? (
                analysis.skills.map((skill) => (
                  <span
                    className="skill-tag"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="empty-message">
                  No common technical skills detected.
                </p>
              )}

            </div>

          </section>
        )}

        {/* SUGGESTIONS */}
        {analysis && (
          <section className="preview-card">

            <h2>
              💡 CARA Suggestions
            </h2>

            <div className="suggestions">

              {analysis.suggestions.map(
                (suggestion, index) => (
                  <div
                    className="suggestion-item"
                    key={index}
                  >
                    <span>
                      ✓
                    </span>

                    <p>
                      {suggestion}
                    </p>
                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* EXTRACTED TEXT */}
        {resumeText && (
          <details className="raw-resume">

            <summary>
              View Extracted Resume Text
            </summary>

            <div className="resume-text">
              {resumeText}
            </div>

          </details>
        )}

        {/* CONTINUE TO AGENT 02 */}
        {analysis && (
          <section className="preview-card">

            <div
              style={{
                textAlign: "center",
                padding: "10px",
              }}
            >

              <h2>
                🎯 Resume Analysis Complete
              </h2>

              <p className="empty-message">
                Your resume has been successfully analyzed.
                Continue to Agent 02 to compare it with a job description.
              </p>

              <button
                className="upload-btn"
                type="button"
                onClick={handleContinue}
                style={{
                  marginTop: "20px",
                }}
              >
                Continue to ATS Matching →
              </button>

            </div>

          </section>
        )}

      </main>
    </div>
  );
}

export default ResumeAgent;