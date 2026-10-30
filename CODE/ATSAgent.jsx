import React, { useState } from "react";

function ATSAgent({ onBack, onComplete, resumeText: initialResumeText }) {
  const [resumeText, setResumeText] = useState(initialResumeText || "");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeATS = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      alert("Please enter both Resume Text and Job Description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze-ats",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description: jobDescription,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("ATS backend analysis failed");
      }

      const data = await response.json();

      console.log("CARA ATS Result:", data);

      setResult({
        score: data.ats_score,
        requiredSkills: data.required_skills || [],
        matchedSkills: data.matched_skills || [],
        missingSkills: data.missing_skills || [],
        explanation:
          data.explanation ||
          "ATS analysis completed successfully.",
        suggestions: data.suggestions || [],
      });

    } catch (err) {
      console.error(err);

      setError(
        "Unable to analyze ATS match. Please make sure the CARA backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (!result) {
      alert("Please analyze the ATS match first.");
      return;
    }

    if (onComplete) {
      onComplete(result.score);
    }
  };

  return (
    <div className="agent-page">

      {/* HEADER */}
      <header className="agent-header">

        <div>
          <p className="agent-label">
            AGENT 02
          </p>

          <h1>
            Explainable ATS Matching Agent
          </h1>

          <p>
            Compare a candidate's resume with a job description and explain
            the matching score.
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

        {/* RESUME SECTION */}
        <section className="preview-card">

          <h2>
            📄 Resume Information
          </h2>

          {initialResumeText ? (
            <p className="empty-message">
              ✅ Resume received from Agent 01.
              You can edit the text below if needed.
            </p>
          ) : (
            <p className="empty-message">
              Paste the candidate's resume text below.
            </p>
          )}

          <textarea
            placeholder="Paste the candidate's resume text here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows="12"
            style={{
              width: "100%",
              padding: "15px",
              marginTop: "10px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />

        </section>

        {/* JOB DESCRIPTION */}
        <section className="preview-card">

          <h2>
            💼 Job Description
          </h2>

          <p className="empty-message">
            Paste the job description for the position you want to apply for.
          </p>

          <textarea
            placeholder="Example: We are looking for a Python developer with experience in Machine Learning, SQL, FastAPI and Git..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows="12"
            style={{
              width: "100%",
              padding: "15px",
              marginTop: "10px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />

          {/* ANALYZE BUTTON */}
          <button
            className="upload-btn"
            type="button"
            onClick={analyzeATS}
            disabled={loading}
            style={{
              marginTop: "20px",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "⏳ Analyzing..."
              : "Analyze ATS Match"}
          </button>

          {error && (
            <p className="error-message">
              ⚠️ {error}
            </p>
          )}

        </section>

        {/* RESULTS */}
        {result && (
          <>
            {/* SCORE */}
            <section className="preview-card">

              <h2>
                🎯 ATS Match Score
              </h2>

              <div className="preview-grid">

                <div className="preview-item">
                  <span>
                    Match Score
                  </span>

                  <strong>
                    {result.score}%
                  </strong>
                </div>

                <div className="preview-item">
                  <span>
                    Required Skills
                  </span>

                  <strong>
                    {result.requiredSkills.length}
                  </strong>
                </div>

                <div className="preview-item">
                  <span>
                    Matched Skills
                  </span>

                  <strong>
                    {result.matchedSkills.length}
                  </strong>
                </div>

                <div className="preview-item">
                  <span>
                    Missing Skills
                  </span>

                  <strong>
                    {result.missingSkills.length}
                  </strong>
                </div>

              </div>

            </section>

            {/* MATCHED SKILLS */}
            <section className="preview-card">

              <h2>
                ✅ Matched Skills
              </h2>

              <div className="skills-list">

                {result.matchedSkills.length > 0 ? (
                  result.matchedSkills.map((skill) => (
                    <span
                      className="skill-tag"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="empty-message">
                    No matching skills found.
                  </p>
                )}

              </div>

            </section>

            {/* MISSING SKILLS */}
            <section className="preview-card">

              <h2>
                ❌ Missing Skills
              </h2>

              <div className="skills-list">

                {result.missingSkills.length > 0 ? (
                  result.missingSkills.map((skill) => (
                    <span
                      className="skill-tag"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="empty-message">
                    No important skills are missing.
                  </p>
                )}

              </div>

            </section>

            {/* EXPLANATION */}
            <section className="preview-card">

              <h2>
                💡 CARA Explanation
              </h2>

              <p className="empty-message">
                {result.explanation}
              </p>

            </section>

            {/* SUGGESTIONS */}
            {result.suggestions.length > 0 && (
              <section className="preview-card">

                <h2>
                  📌 Improvement Suggestions
                </h2>

                <div className="suggestions">

                  {result.suggestions.map(
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

            {/* COMPLETE AGENT */}
            <section className="preview-card">

              <div
                style={{
                  textAlign: "center",
                  padding: "10px",
                }}
              >

                <h2>
                  ✅ ATS Analysis Complete
                </h2>

                <p className="empty-message">
                  Your resume has been compared with the job description.
                  Agent 02 is now complete.
                </p>

                <button
                  className="upload-btn"
                  type="button"
                  onClick={handleComplete}
                  style={{
                    marginTop: "20px",
                  }}
                >
                  Complete Agent 02 →
                </button>

              </div>

            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default ATSAgent;