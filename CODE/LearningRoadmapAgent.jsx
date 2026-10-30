
import { useState } from "react";

function LearningRoadmapAgent({
  resumeText,
  onBack,
  onComplete,
}) {
  const [targetRole, setTargetRole] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRoadmap = async () => {
    if (!targetRole.trim()) {
      alert("Please enter your target career role.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/generate-roadmap",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText || "",
            target_role: targetRole.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate roadmap");
      }

      const data = await response.json();

      setRoadmap({
        targetRole: data.target_role,
        existingSkills: data.skills_found,
        missingSkills: data.skills_to_develop,
        beginner: data.beginner,
        intermediate: data.intermediate,
        advanced: data.advanced,
        projects: data.projects,
      });
    } catch (error) {
      console.error("Roadmap generation error:", error);

      alert(
        "Unable to connect to the backend. Please make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetRoadmap = () => {
    setRoadmap(null);
    setTargetRole("");
  };

  const finishRoadmap = () => {
    if (!roadmap) {
      alert("Please generate your learning roadmap first.");
      return;
    }

    // Agent 4 receives 100% when a roadmap is successfully generated
    // and the user completes the roadmap flow.
    const roadmapScore = 100;

    try {
      // Save Agent 4 score using the dashboard's localStorage keys.
      localStorage.setItem(
        "cara_agent04_score",
        String(roadmapScore)
      );

      const savedScores = JSON.parse(
        localStorage.getItem("cara_agent_scores") || "{}"
      );

      savedScores["04"] = roadmapScore;

      localStorage.setItem(
        "cara_agent_scores",
        JSON.stringify(savedScores)
      );

      // Notify the parent dashboard that Agent 4 is complete.
      if (onComplete) {
        onComplete(roadmapScore);
      }

      alert(
        `Learning Roadmap completed! Score: ${roadmapScore}%`
      );
    } catch (error) {
      console.error("Unable to save Agent 4 score:", error);

      // Still notify the dashboard if localStorage saving fails.
      if (onComplete) {
        onComplete(roadmapScore);
      }

      alert(
        "Roadmap completed, but the score could not be saved locally."
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #090914, #121025)",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "auto",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            padding: "10px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            marginBottom: "30px",
          }}
        >
          ← Back to Dashboard
        </button>

        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "55px",
            }}
          >
            🗺️
          </div>

          <h1
            style={{
              fontSize: "38px",
              marginBottom: "10px",
            }}
          >
            Personalized Learning Roadmap
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "17px",
            }}
          >
            Enter your target career and generate
            a personalized learning roadmap.
          </p>
        </div>

        {!roadmap && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              padding: "35px",
              maxWidth: "700px",
              margin: "auto",
            }}
          >
            <h2>Choose Your Target Career</h2>

            <p
              style={{
                color: "rgba(255,255,255,0.65)",
              }}
            >
              Examples: Python Developer, AI Engineer,
              Photographer, UI UX Designer, Web Developer,
              Data Analyst, Cybersecurity Professional.
            </p>

            <input
              type="text"
              placeholder="Example: Python Developer"
              value={targetRole}
              onChange={(event) =>
                setTargetRole(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !loading) {
                  generateRoadmap();
                }
              }}
              style={{
                width: "100%",
                padding: "15px",
                marginTop: "20px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />

            <button
              onClick={generateRoadmap}
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "15px",
                border: "none",
                borderRadius: "10px",
                background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Generating Roadmap..."
                : "Generate My Roadmap →"}
            </button>
          </div>
        )}

        {roadmap && (
          <div>
            <div
              style={{
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.4)",
                borderRadius: "20px",
                padding: "25px",
                marginBottom: "25px",
              }}
            >
              <p
                style={{
                  color: "#a78bfa",
                  margin: "0 0 8px 0",
                  fontWeight: "bold",
                }}
              >
                TARGET CAREER
              </p>

              <h2
                style={{
                  margin: "0",
                }}
              >
                {roadmap.targetRole}
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  padding: "25px",
                }}
              >
                <h2>✓ Skills Found</h2>

                {roadmap.existingSkills?.length > 0 ? (
                  roadmap.existingSkills.map((skill, index) => (
                    <p key={`${skill}-${index}`}>
                      🟢 {skill}
                    </p>
                  ))
                ) : (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    No matching skills were detected
                    in the current resume.
                  </p>
                )}
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  padding: "25px",
                }}
              >
                <h2>⚠ Skills to Develop</h2>

                {roadmap.missingSkills?.length > 0 ? (
                  roadmap.missingSkills.map((skill, index) => (
                    <p key={`${skill}-${index}`}>
                      🟡 {skill}
                    </p>
                  ))
                ) : (
                  <p>
                    🎉 You have all the major skills!
                  </p>
                )}
              </div>
            </div>

            <h2
              style={{
                marginBottom: "20px",
              }}
            >
              Your Learning Journey
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  padding: "25px",
                }}
              >
                <h2>🌱 Beginner</h2>

                {roadmap.beginner?.length > 0 ? (
                  roadmap.beginner.map((step, index) => (
                    <p key={index}>
                      {index + 1}. {step}
                    </p>
                  ))
                ) : (
                  <p>No beginner steps available.</p>
                )}
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  padding: "25px",
                }}
              >
                <h2>🚀 Intermediate</h2>

                {roadmap.intermediate?.length > 0 ? (
                  roadmap.intermediate.map((step, index) => (
                    <p key={index}>
                      {index + 1}. {step}
                    </p>
                  ))
                ) : (
                  <p>No intermediate steps available.</p>
                )}
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  padding: "25px",
                }}
              >
                <h2>🏆 Advanced</h2>

                {roadmap.advanced?.length > 0 ? (
                  roadmap.advanced.map((step, index) => (
                    <p key={index}>
                      {index + 1}. {step}
                    </p>
                  ))
                ) : (
                  <p>No advanced steps available.</p>
                )}
              </div>
            </div>

            <div
              style={{
                background: "rgba(236,72,153,0.08)",
                border: "1px solid rgba(236,72,153,0.25)",
                borderRadius: "20px",
                padding: "25px",
                marginTop: "30px",
              }}
            >
              <h2>💼 Recommended Projects</h2>

              {roadmap.projects?.length > 0 ? (
                roadmap.projects.map((project, index) => (
                  <p key={index}>
                    {index + 1}. {project}
                  </p>
                ))
              ) : (
                <p>No recommended projects available.</p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "15px",
                marginTop: "30px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={resetRoadmap}
                style={{
                  padding: "14px 22px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ← Try Another Career
              </button>

              <button
                onClick={finishRoadmap}
                style={{
                  padding: "14px 22px",
                  border: "none",
                  borderRadius: "10px",
                  background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Complete Roadmap ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningRoadmapAgent;