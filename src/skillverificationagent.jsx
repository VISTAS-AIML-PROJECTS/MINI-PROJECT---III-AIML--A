import React, { useState, useEffect } from "react";

const SKILL_KEYWORDS = [
  { name: "HTML", keywords: ["html", "html5"] },
  { name: "CSS", keywords: ["css", "css3"] },
  { name: "JavaScript", keywords: ["javascript"] },
  { name: "React", keywords: ["react.js", "react"] },
  { name: "UI/UX Design", keywords: ["ui/ux", "ui design", "ux design"] },
  { name: "Web Design", keywords: ["web design", "web designer"] },
  { name: "Responsive Web Design", keywords: ["responsive web design", "responsive design"] },
  { name: "Figma", keywords: ["figma"] },
  { name: "Adobe XD", keywords: ["adobe xd"] },
  { name: "Photoshop", keywords: ["photoshop"] },
  { name: "Wireframing", keywords: ["wireframing", "wireframes"] },
  { name: "Prototyping", keywords: ["prototyping"] },
  { name: "Bootstrap", keywords: ["bootstrap"] },
  { name: "Tailwind CSS", keywords: ["tailwind css"] },
  { name: "Python", keywords: ["python"] },
  { name: "Java", keywords: ["java"] },
  { name: "SQL", keywords: ["sql", "mysql", "postgresql"] },
  { name: "Machine Learning", keywords: ["machine learning"] },
  { name: "Deep Learning", keywords: ["deep learning"] },
  { name: "Artificial Intelligence", keywords: ["artificial intelligence"] },
  { name: "NLP", keywords: ["natural language processing", "nlp"] },
  { name: "Data Analysis", keywords: ["data analysis", "data analytics"] },
  { name: "Git", keywords: ["git", "github"] },
  { name: "Node.js", keywords: ["node.js", "nodejs"] },
  { name: "REST API", keywords: ["rest api", "restful api"] },
  { name: "Problem Solving", keywords: ["problem solving"] },
  { name: "Communication", keywords: ["communication skills"] },
];

function extractResumeSkills(resumeText) {
  if (!resumeText || !resumeText.trim()) {
    return [];
  }

  const text = resumeText.toLowerCase();

  return SKILL_KEYWORDS
    .filter(({ keywords }) =>
      keywords.some((keyword) => {
        const escaped = keyword.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        const pattern = new RegExp(
          `(^|[^a-z0-9])${escaped}($|[^a-z0-9])`,
          "i"
        );

        return pattern.test(text);
      })
    )
    .map(({ name }) => name);
}

function SkillVerificationAgent({
  resumeText,
  onBack,
  onComplete,
}) {
  const [skills, setSkills] = useState(
    () => extractResumeSkills(resumeText)
  );

  const [newSkill, setNewSkill] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSkills(extractResumeSkills(resumeText));
    setResult(null);
    setError("");
  }, [resumeText]);

  const addSkill = () => {
    const cleanSkill = newSkill.trim();

    if (!cleanSkill) return;

    if (
      !skills.some(
        (skill) =>
          skill.toLowerCase() === cleanSkill.toLowerCase()
      )
    ) {
      setSkills((previous) => [...previous, cleanSkill]);
      setResult(null);
    }

    setNewSkill("");
    setError("");
  };

  const removeSkill = (skillToRemove) => {
    setSkills((previous) =>
      previous.filter((skill) => skill !== skillToRemove)
    );

    setResult(null);
    setError("");
  };

  const verifySkills = async () => {
    if (!resumeText || !resumeText.trim()) {
      setError(
        "No resume found. Please complete Agent 01 first."
      );
      return;
    }

    if (skills.length === 0) {
      setError("No skills found. Please add a skill first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/verify-skills",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText,
            skills: skills,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Verification failed: ${response.status}`
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to verify skills. Check whether the backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  const completeAgent = () => {
    if (!result || !onComplete) return;

    onComplete(result.overall_verification_score);
  };

  const resultItems =
    result?.results ||
    result?.skill_results ||
    result?.verified_skills;

  return (
    <div className="agent-page">
      <header className="agent-header">
        <div>
          <p className="agent-label">AGENT 03</p>
          <h1>Evidence-Based Skill Verification</h1>
          <p>
            Check whether your claimed skills are supported
            by evidence in your resume.
          </p>
        </div>

        <button
          className="back-btn"
          type="button"
          onClick={onBack}
        >
          ← Back
        </button>
      </header>

      <section className="agent-card">
        <h2>🔍 Skills to Verify</h2>

        <p className="empty-message">
          Skills detected from your resume appear below.
          You can add or remove skills before verification.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Enter a skill..."
            value={newSkill}
            onChange={(event) =>
              setNewSkill(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSkill();
              }
            }}
            style={{
              flex: "1",
              minWidth: "200px",
              padding: "12px",
              borderRadius: "10px",
            }}
          />

          <button
            className="upload-btn"
            type="button"
            onClick={addSkill}
          >
            + Add Skill
          </button>
        </div>

        <div
          className="skills-list"
          style={{ marginTop: "20px" }}
        >
          {skills.length > 0 ? (
            skills.map((skill) => (
              <button
                className="skill-tag"
                key={skill}
                type="button"
                onClick={() => removeSkill(skill)}
                title={`Remove ${skill}`}
                style={{ cursor: "pointer" }}
              >
                {skill} ×
              </button>
            ))
          ) : (
            <p className="empty-message">
              No recognized skills found in the resume.
              Add a skill manually if required.
            </p>
          )}
        </div>

        <button
          className="upload-btn"
          type="button"
          onClick={verifySkills}
          disabled={loading || skills.length === 0}
          style={{ marginTop: "25px" }}
        >
          {loading ? "Verifying Skills..." : "Verify Skills"}
        </button>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>

      {result && (
        <section
          className="agent-card"
          style={{ marginTop: "24px" }}
        >
          <h2>Verification Results</h2>

          {result.overall_verification_score !== undefined && (
            <p>
              <strong>Overall Verification Score: </strong>
              {result.overall_verification_score}
            </p>
          )}

          {Array.isArray(resultItems) ? (
            resultItems.map((item, index) => {
              const skillName =
                item.skill ||
                item.name ||
                item.claimed_skill ||
                `Skill ${index + 1}`;

              const status =
                item.status ||
                item.verification_status ||
                "Not Verified";

              return (
                <div
                  key={`${skillName}-${index}`}
                  className={`skill-result ${
                    status === "Verified"
                      ? "verified"
                      : status === "Partially Verified"
                      ? "partial"
                      : status === "Claimed Only"
                      ? "claimed"
                      : "not-verified"
                  }`}
                  style={{
                    padding: "12px",
                    marginTop: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <strong>{skillName}</strong>
                  <p>Status: {status}</p>

                  {(item.evidence ||
                    item.feedback ||
                    item.reason) && (
                    <p>
                      {item.evidence ||
                        item.feedback ||
                        item.reason}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          )}

          <button
            className="upload-btn"
            type="button"
            onClick={completeAgent}
            style={{ marginTop: "20px" }}
          >
            Complete Agent 03
          </button>
        </section>
      )}
    </div>
  );
}

export default SkillVerificationAgent;