
import React, { useState } from "react";
import { calculateReadiness } from "./api";
import "./Agent6.css";

export default function Agent6({ scores = {}, onBack, onComplete }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await calculateReadiness(scores);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Return to dashboard and report completion after analysis
  const handleBack = () => {
    if (result) {
      onComplete?.(Number(result.career_readiness_score));
    } else {
      onBack?.();
    }
  };

  const agents = [
    { id: 1, name: "Agent 1", label: "Career Profile" },
    { id: 2, name: "Agent 2", label: "Skills Analysis" },
    { id: 3, name: "Agent 3", label: "Performance" },
    { id: 5, name: "Agent 5", label: "Interview Readiness" },
  ];

  const score = result?.career_readiness_score ?? 0;

  return (
    <div className="agent6-page">
      <div className="agent6-dashboard">

        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="back-btn"
              type="button"
              onClick={handleBack}
            >
              ← Back to Dashboard
            </button>

            <div className="eyebrow">
              CARA • AI CAREER INTELLIGENCE
            </div>

            <h1>HR Decision Command Center</h1>

            <p>
              Agent 6 combines insights from four career-readiness agents
              into one final hiring recommendation.
            </p>
          </div>

          <div className="status-badge">
            <span className="status-dot"></span>
            AI SYSTEM ONLINE
          </div>
        </header>

        {/* HERO */}
        <section className="hero-grid">

          {/* SCORE CARD */}
          <div className="score-card">
            <div className="card-label">
              CAREER READINESS SCORE
            </div>

            <div className="score-ring">
              <div className="score-inner">
                <span>{score}</span>
                <small>/ 100</small>
              </div>
            </div>

            <h2>Overall Readiness Score</h2>

            <p>
              A combined evaluation of the candidate's career readiness.
            </p>

            <button
              className="calculate-btn"
              onClick={calculate}
              disabled={loading}
            >
              {loading
                ? "ANALYZING..."
                : "✦ CALCULATE FINAL SCORE"}
            </button>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}
          </div>

          {/* DECISION CARD */}
          <div className="decision-card">
            <div className="card-label">
              FINAL HR DECISION
            </div>

            <div className="decision-icon">
              ✦
            </div>

            <h2>
              {result?.hr_decision || "Awaiting Analysis"}
            </h2>

            <p>
              {result?.recommendation ||
                "Run the AI analysis to generate the final HR recommendation."}
            </p>

            <div className="decision-line"></div>

            <span className="decision-caption">
              AI-ASSISTED HR RECOMMENDATION
            </span>
          </div>
        </section>

        {/* PERFORMANCE JOURNEY */}
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span>01</span>
              <h2>Performance Journey</h2>
            </div>

            <p>
              Four intelligence agents contributing to the final score
            </p>
          </div>

          <div className="agent-list">
            {agents.map((agent) => {
              const value =
                scores[`agent${agent.id}`] ??
                scores[String(agent.id)] ??
                null;

              const numericValue = Math.min(
                Number(value) || 0,
                100
              );

              return (
                <div
                  className="agent-row"
                  key={agent.id}
                >
                  <div className="agent-number">
                    0{agent.id}
                  </div>

                  <div className="agent-info">
                    <strong>
                      {agent.name}
                    </strong>

                    <span>
                      {agent.label}
                    </span>
                  </div>

                  <div className="agent-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${numericValue}%`,
                      }}
                    ></div>
                  </div>

                  <div className="agent-score">
                    {value !== null
                      ? `${value}/100`
                      : "--"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* INSIGHTS */}
        <section className="insight-grid">

          <div className="insight-card strengths">
            <div className="insight-top">
              <span className="insight-symbol">
                ↑
              </span>
            </div>

            <h3>Strengths</h3>

            <p>
              {result?.strengths?.join(" ") ||
                "You've done a very good job in your stronger areas. Keep building on these skills and use them as your competitive advantage."}
            </p>

            <div className="interactive-caption">
              ✦ Keep it up — your strongest skills are giving you an edge.
            </div>
          </div>

          <div className="insight-card weaknesses">
            <div className="insight-top">
              <span className="insight-symbol">
                ↓
              </span>
            </div>

            <h3>Improvement Areas</h3>

            <p>
              {result?.weaknesses?.join(" ") ||
                "There are a few areas that need more attention. Focus on these skills and you'll see your readiness improve."}
            </p>

            <div className="interactive-caption">
              ⚡ You can improve here — focus, practice, and keep progressing.
            </div>
          </div>

          <div className="insight-card priorities">
            <div className="insight-top">
              <span className="insight-symbol">
                ◆
              </span>
            </div>

            <h3>Development Priorities</h3>

            <p>
              {result?.development_priorities?.join(" ") ||
                "Your next step is to strengthen the competencies with the biggest opportunity for improvement."}
            </p>

            <div className="interactive-caption">
              🚀 Your next move: strengthen these areas and level up your career readiness.
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="dashboard-footer">
          <span>CARA</span>

          <span>
            AGENT 06 • HR DECISION SUPPORT
          </span>

          <span>
            AI-POWERED CAREER INTELLIGENCE
          </span>
        </footer>

      </div>
    </div>
  );
}