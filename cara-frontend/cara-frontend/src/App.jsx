
import { useEffect, useState } from "react";

import CARAIntro from "./CARAIntro";
import Landing from "./Landing";
import Login from "./Login";
import Signup from "./Signup";

import ResumeAgent from "./ResumeAgent";
import ATSAgent from "./ATSAgent";
import SkillVerificationAgent from "./skillverificationagent";
import LearningRoadmapAgent from "./LearningRoadmapAgent";
import MockInterviewAgent from "./MockinterviewAgent";
import Agent6 from "./Agent6";

import "./App.css";

const agents = [
  {
    id: "01",
    icon: "📄",
    title: "Resume Intelligence",
    shortTitle: "Resume Intelligence",
    description:
      "Analyze your resume and identify skills, strengths, and important information.",
  },
  {
    id: "02",
    icon: "🎯",
    title: "Explainable ATS Matching",
    shortTitle: "ATS Matching",
    description:
      "Compare your resume with a job description and calculate your ATS match.",
  },
  {
    id: "03",
    icon: "🔍",
    title: "Skill Verification",
    shortTitle: "Skill Verification",
    description:
      "Verify your skills using evidence-based analysis.",
  },
  {
    id: "04",
    icon: "🗺️",
    title: "Learning Roadmap",
    shortTitle: "Learning Roadmap",
    description:
      "Get a personalized roadmap based on your skill gaps.",
  },
  {
    id: "05",
    icon: "🎤",
    title: "Mock Interview",
    shortTitle: "Mock Interview",
    description:
      "Practice adaptive interview questions and receive feedback.",
  },
  {
    id: "06",
    icon: "📊",
    title: "HR Decision Support",
    shortTitle: "HR Decision Support",
    description:
      "View your overall career readiness and recommendations.",
  },
];

const agentWeights = {
  "01": 10,
  "02": 20,
  "03": 15,
  "04": 15,
  "05": 20,
  "06": 20,
};

function getUserStorageKey(email, key) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return `cara_user_${encodeURIComponent(normalizedEmail)}_${key}`;
}

function readUserData(email, key, fallback) {
  if (!email) return fallback;

  try {
    const saved = localStorage.getItem(getUserStorageKey(email, key));
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function writeUserData(email, key, value) {
  if (!email) return;

  try {
    localStorage.setItem(
      getUserStorageKey(email, key),
      JSON.stringify(value)
    );
  } catch (error) {
    console.error("Unable to save CARA user data:", error);
  }
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [savedResumeText, setSavedResumeText] = useState("");
  const [mockInterviewResult, setMockInterviewResult] = useState(null);
  const [completedAgents, setCompletedAgents] = useState([]);
  const [agentScores, setAgentScores] = useState({});

  // Load the selected user's saved progress after login or account change.
  useEffect(() => {
    if (!currentUserEmail) {
      setCompletedAgents([]);
      setAgentScores({});
      setSavedResumeText("");
      return;
    }

    const savedCompleted = readUserData(
      currentUserEmail,
      "completed_agents",
      []
    );

    const savedScores = readUserData(
      currentUserEmail,
      "agent_scores",
      {}
    );

    const savedResume = readUserData(
      currentUserEmail,
      "saved_resume_text",
      ""
    );

    setCompletedAgents(
      Array.isArray(savedCompleted) ? savedCompleted : []
    );
    setAgentScores(
      savedScores && typeof savedScores === "object"
        ? savedScores
        : {}
    );
    setSavedResumeText(
      typeof savedResume === "string" ? savedResume : ""
    );
  }, [currentUserEmail]);

  const saveAgentScore = (agentId, score) => {
    if (score === undefined || score === null || !currentUserEmail) {
      return;
    }

    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return;

    const safeScore = Math.max(0, Math.min(100, numericScore));

    setAgentScores((previous) => {
      const updated = {
        ...previous,
        [agentId]: safeScore,
      };

      writeUserData(currentUserEmail, "agent_scores", updated);
      return updated;
    });

    // Keep a user-scoped individual score for compatibility with dashboard data.
    writeUserData(currentUserEmail, `agent${agentId}_score`, safeScore);
  };

  const markAgentCompleted = (agentId) => {
    if (!currentUserEmail) return;

    setCompletedAgents((previous) => {
      if (previous.includes(agentId)) return previous;

      const updated = [...previous, agentId];
      writeUserData(currentUserEmail, "completed_agents", updated);
      return updated;
    });
  };

  const getStoredScore = (agentId) => {
    const stateScore = agentScores[agentId];

    if (
      stateScore !== undefined &&
      stateScore !== null &&
      Number.isFinite(Number(stateScore))
    ) {
      return Number(stateScore);
    }

    const storedScore = readUserData(
      currentUserEmail,
      `agent${agentId}_score`,
      null
    );

    if (storedScore === null || storedScore === "") return null;

    const numericScore = Number(storedScore);
    return Number.isFinite(numericScore) ? numericScore : null;
  };

  // Handle completion events dispatched by Agents 05 and 06.
  useEffect(() => {
    const handleAgentCompleted = (event) => {
      const agentId = event?.detail?.agentId;
      if (agentId !== "05" && agentId !== "06") return;

      markAgentCompleted(agentId);

      const score = event?.detail?.score;
      if (score !== undefined && score !== null) {
        saveAgentScore(agentId, score);
      }

      if (agentId === "06") {
        setSelectedAgent(null);
      }
    };

    window.addEventListener("agent-completed", handleAgentCompleted);

    return () => {
      window.removeEventListener("agent-completed", handleAgentCompleted);
    };
  }, [currentUserEmail]);

  // Allow agents to return to the dashboard using the app event.
  useEffect(() => {
    const handleBackToDashboard = () => setSelectedAgent(null);

    window.addEventListener(
      "cara-back-to-dashboard",
      handleBackToDashboard
    );

    return () => {
      window.removeEventListener(
        "cara-back-to-dashboard",
        handleBackToDashboard
      );
    };
  }, []);

  const completedCount = completedAgents.length;

  const readinessScore = Math.min(
    100,
    completedAgents.reduce(
      (total, agentId) => total + (agentWeights[agentId] || 0),
      0
    )
  );

  const allAgentsCompleted =
    completedCount === 6 || readinessScore === 100;

  const currentAgent =
    agents.find((agent) => !completedAgents.includes(agent.id)) || null;

  const currentIndex = currentAgent
    ? agents.findIndex((agent) => agent.id === currentAgent.id)
    : -1;

  const nextAgent =
    currentIndex >= 0 ? agents[currentIndex + 1] || null : null;

  const openAgent = (agentId) => {
    if (agents.some((agent) => agent.id === agentId)) {
      setSelectedAgent(agentId);
    }
  };

  const handleLoginSuccess = (email) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      alert("Email is required to load your CARA account.");
      return;
    }

    setCurrentUserEmail(normalizedEmail);
    setCurrentUser({ email: normalizedEmail });
    setLoggedIn(true);
    setShowSignup(false);
    setShowLanding(false);
    setSelectedAgent(null);
  };

  const handleSignupSuccess = (user) => {
    const normalizedEmail = String(user?.email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      alert("Please provide a valid email address.");
      return;
    }

    setCurrentUserEmail(normalizedEmail);
    setCurrentUser({
      name: user?.name || "",
      email: normalizedEmail,
    });
    setLoggedIn(true);
    setShowSignup(false);
    setShowLanding(false);
    setSelectedAgent(null);
  };

  const handleLogout = () => {
    // Preserve this user's progress in their own browser storage.
    setLoggedIn(false);
    setSelectedAgent(null);
    setCurrentUser(null);
    setCurrentUserEmail("");
    setCompletedAgents([]);
    setAgentScores({});
    setSavedResumeText("");
    setMockInterviewResult(null);
    setShowSignup(false);
    setShowLanding(true);
  };

  if (showIntro) {
    return (
      <CARAIntro
        onComplete={() => setShowIntro(false)}
      />
    );
  }

  if (showLanding) {
    return (
      <Landing
        onLogin={() => {
          setShowLanding(false);
          setShowSignup(false);
        }}
        onSignup={() => {
          setShowLanding(false);
          setShowSignup(true);
        }}
      />
    );
  }

  if (showSignup) {
    return (
      <Signup
        onSignup={handleSignupSuccess}
        onLogin={() => setShowSignup(false)}
      />
    );
  }

  if (!loggedIn) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSignup={() => setShowSignup(true)}
      />
    );
  }

  if (selectedAgent === "01") {
    return (
      <ResumeAgent
        onBack={() => setSelectedAgent(null)}
        onComplete={(resumeText, score) => {
          const resume = resumeText || "";

          setSavedResumeText(resume);
          writeUserData(
            currentUserEmail,
            "saved_resume_text",
            resume
          );

          if (score !== undefined && score !== null) {
            saveAgentScore("01", score);
          }

          markAgentCompleted("01");
          setSelectedAgent(null);
        }}
      />
    );
  }

  if (selectedAgent === "02") {
    return (
      <ATSAgent
        resumeText={savedResumeText}
        onBack={() => setSelectedAgent(null)}
        onComplete={(score) => {
          if (score !== undefined && score !== null) {
            saveAgentScore("02", score);
          }

          markAgentCompleted("02");
          setSelectedAgent(null);
        }}
      />
    );
  }

  if (selectedAgent === "03") {
    return (
      <SkillVerificationAgent
        resumeText={savedResumeText}
        onBack={() => setSelectedAgent(null)}
        onComplete={(score) => {
          if (score !== undefined && score !== null) {
            saveAgentScore("03", score);
          }

          markAgentCompleted("03");
          setSelectedAgent(null);
        }}
      />
    );
  }

  if (selectedAgent === "04") {
    return (
      <LearningRoadmapAgent
        resumeText={savedResumeText}
        onBack={() => setSelectedAgent(null)}
        onComplete={(score) => {
          if (score !== undefined && score !== null) {
            saveAgentScore("04", score);
          }

          markAgentCompleted("04");
          setSelectedAgent(null);
        }}
      />
    );
  }

  if (selectedAgent === "05") {
    return (
      <MockInterviewAgent
        profile={currentUser || {}}
        resumeText={savedResumeText}
        onBack={() => setSelectedAgent(null)}
        onComplete={(result) => {
          setMockInterviewResult(result || null);

          if (result) {
            const rawScore =
              result.score ??
              result.overall_score ??
              result.overallScore ??
              result.rating;

            if (rawScore !== undefined && rawScore !== null) {
              const numericScore = Number(rawScore);
              const dashboardScore =
                numericScore <= 10
                  ? numericScore * 10
                  : numericScore;

              if (Number.isFinite(dashboardScore)) {
                saveAgentScore("05", dashboardScore);
              }
            }
          }

          markAgentCompleted("05");
          setSelectedAgent(null);
        }}
      />
    );
  }

  if (selectedAgent === "06") {
    return (
      <Agent6
        scores={{
          agent1: getStoredScore("01"),
          agent2: getStoredScore("02"),
          agent3: getStoredScore("03"),
          agent4: getStoredScore("04"),
          agent5: getStoredScore("05"),
        }}
        onBack={() => setSelectedAgent(null)}
        onComplete={(score) => {
          if (score !== undefined && score !== null) {
            saveAgentScore("06", score);
          }

          markAgentCompleted("06");
          setSelectedAgent(null);
        }}
      />
    );
  }

  return (
    <div className="cara-app">
      <style>
        {`
          .score-circle {
            transition: background 1s ease, transform 0.4s ease, box-shadow 0.6s ease;
          }
          .score-circle:hover {
            transform: scale(1.03);
          }
          .score-number {
            transition: all 0.5s ease;
          }
          .agent-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          }
          .agent-card:hover {
            transform: translateY(-3px);
          }
          .agent-current {
            box-shadow: 0 0 25px rgba(139, 92, 246, 0.18);
          }
          .agent-completed {
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.12);
          }
          .coming-soon-btn {
            opacity: 0.45;
            cursor: not-allowed !important;
          }
          .career-journey-card {
            width: 100%;
            padding: 28px;
            border-radius: 24px;
            box-sizing: border-box;
          }
          .journey-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-bottom: 26px;
            flex-wrap: wrap;
          }
          .journey-title {
            margin: 0;
            color: #fff;
            font-size: 22px;
            font-weight: 800;
          }
          .journey-subtitle {
            margin: 7px 0 0;
            color: rgba(255,255,255,0.58);
            font-size: 13px;
          }
          .journey-complete-badge {
            padding: 10px 17px;
            border-radius: 30px;
            background: linear-gradient(90deg, rgba(139,92,246,0.25), rgba(236,72,153,0.25));
            border: 1px solid rgba(236,72,153,0.35);
            color: #fff;
            font-size: 13px;
            font-weight: 800;
          }
          .journey-chart {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
            min-height: 190px;
            padding: 22px 10px 8px;
            border-radius: 18px;
            background: rgba(255,255,255,0.035);
            border: 1px solid rgba(255,255,255,0.07);
          }
          .journey-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            height: 165px;
            min-width: 45px;
          }
          .journey-value {
            margin-bottom: 8px;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }
          .journey-bar-area {
            width: 100%;
            max-width: 55px;
            height: 115px;
            display: flex;
            align-items: flex-end;
          }
          .journey-bar {
            width: 100%;
            border-radius: 12px 12px 5px 5px;
            background: linear-gradient(180deg, #8b5cf6, #ec4899);
            box-shadow: 0 0 18px rgba(139,92,246,0.25);
            transition: height 0.7s ease;
          }
          .journey-agent {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            margin-top: 9px;
            color: rgba(255,255,255,0.7);
            font-size: 11px;
            font-weight: 700;
            text-align: center;
          }
          .journey-status {
            margin-top: 4px;
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            text-align: center;
          }
          .final-career-message {
            margin-top: 20px;
            padding: 20px;
            border-radius: 18px;
            text-align: center;
            background: linear-gradient(90deg, rgba(139,92,246,0.12), rgba(236,72,153,0.12));
            border: 1px solid rgba(236,72,153,0.2);
          }
          .final-career-message strong {
            display: block;
            color: #fff;
            font-size: 18px;
            margin-bottom: 6px;
          }
          .final-career-message span {
            color: rgba(255,255,255,0.62);
            font-size: 13px;
          }
          @media (max-width: 700px) {
            .career-journey-card {
              padding: 18px;
            }
            .journey-chart {
              gap: 7px;
              padding: 18px 5px 8px;
              overflow-x: auto;
            }
            .journey-column {
              min-width: 45px;
            }
            .journey-value {
              font-size: 10px;
            }
            .journey-agent {
              font-size: 9px;
            }
          }
        `}
      </style>

      <div className="glow glow-purple"></div>
      <div className="glow glow-blue"></div>
      <div className="glow glow-pink"></div>

      <aside className="sidebar glass">
        <div className="logo-section">
          <div className="logo-icon">✦</div>
          <div>
            <h2>CARA</h2>
            <p>Career Intelligence</p>
          </div>
        </div>

        <div className="nav-section">
          <button className="nav-item active" type="button">
            <span>⌂</span>
            Dashboard
          </button>
          <button className="nav-item" type="button">
            <span>◈</span>
            My Profile
          </button>
          <button className="nav-item" type="button">
            <span>◉</span>
            Progress
          </button>
        </div>

        <div className="sidebar-bottom">
          <button
            className="nav-item logout"
            type="button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div>
            <p className="welcome-small">
              YOUR AI CAREER COMPANION
            </p>
            <h1>
              Welcome back <span>👋</span>
            </h1>
            <p className="header-subtitle">
              Explore your career readiness with intelligent AI agents.
            </p>
          </div>

          <div className="header-actions">
            <button className="notification-btn glass" type="button">
              🔔
            </button>
            <div className="profile glass">
              <div className="avatar">
                {(currentUser?.name || currentUserEmail || "S")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <strong>{currentUser?.name || "Student"}</strong>
                <span>{currentUserEmail}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="career-overview glass">
          <div className="overview-text">
            <p className="section-label">
              OVERALL PERFORMANCE
            </p>
            <h2>
              Career Readiness
              <br />
              <span>Dashboard</span>
            </h2>
            <p className="career-description">
              Complete the AI agents below to generate your personalized
              career readiness insights and recommendations.
            </p>
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                if (currentAgent) openAgent(currentAgent.id);
                else setSelectedAgent("06");
              }}
            >
              {allAgentsCompleted
                ? "View Final Progress →"
                : "View Progress →"}
            </button>
          </div>

          <div className="score-container">
            <div
              className="score-circle"
              style={{
                width: "170px",
                height: "170px",
                borderRadius: "50%",
                background: `conic-gradient(from -90deg, #8b5cf6 0deg, #ec4899 ${
                  readinessScore * 3.6
                }deg, rgba(255,255,255,0.18) ${
                  readinessScore * 3.6
                }deg, rgba(255,255,255,0.18) 360deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  readinessScore > 0
                    ? "0 0 30px rgba(139,92,246,0.35)"
                    : "0 0 20px rgba(139,92,246,0.18)",
              }}
            >
              <div
                className="score-inner"
                style={{
                  width: "138px",
                  height: "138px",
                  borderRadius: "50%",
                  background: "#090914",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  className="score-number"
                  style={{
                    fontSize: "34px",
                    fontWeight: "800",
                    background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {readinessScore}%
                </span>
                <span
                  className="score-text"
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {allAgentsCompleted ? "Completed" : "Complete"}
                </span>
              </div>
            </div>
            <p className="score-status">
              {allAgentsCompleted
                ? "Career readiness complete! 🎉"
                : currentAgent
                ? `Next: ${currentAgent.shortTitle}`
                : "Start your career journey"}
            </p>
          </div>
        </section>

        <section className="activity-section">
          <div className="activity-heading">
            <div>
              <p className="section-label">
                {allAgentsCompleted ? "CAREER JOURNEY" : "YOUR PROGRESS"}
              </p>
              <h2>
                {allAgentsCompleted
                  ? "Career Journey Progress"
                  : "Your Current Activity"}
              </h2>
            </div>
            <div className="progress-badge">
              {completedCount} / 6 Completed
            </div>
          </div>

          {allAgentsCompleted ? (
            <div className="career-journey-card glass">
              <div className="journey-header">
                <div>
                  <h3 className="journey-title">
                    Your Career Agent Journey
                  </h3>
                  <p className="journey-subtitle">
                    All six CARA agents have been completed.
                  </p>
                </div>
                <div className="journey-complete-badge">
                  ✓ 100% COMPLETE
                </div>
              </div>

              <div className="journey-chart">
                {agents.map((agent) => {
                  const score = getStoredScore(agent.id);
                  const displayScore =
                    score === null
                      ? null
                      : Math.max(0, Math.min(100, Number(score)));

                  return (
                    <div className="journey-column" key={agent.id}>
                      <div className="journey-value">
                        {displayScore === null
                          ? "—"
                          : `${displayScore}%`}
                      </div>
                      <div className="journey-bar-area">
                        <div
                          className="journey-bar"
                          style={{
                            height:
                              displayScore === null
                                ? "0%"
                                : `${Math.max(4, displayScore)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="journey-agent">
                        <span>AGENT {agent.id}</span>
                        <span>{agent.title}</span>
                      </div>
                      <div className="journey-status">
                        {displayScore === null
                          ? "✓ Completed · score unavailable"
                          : "✓ Score saved"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="final-career-message">
                <strong>
                  🎉 Career Readiness Journey Completed
                </strong>
                <span>
                  You have successfully completed all 6 CARA career agents.
                </span>
              </div>
            </div>
          ) : (
            <div className="activity-grid">
              {currentAgent && (
                <div className="activity-card glass">
                  <div className="activity-icon active-icon">
                    {currentAgent.icon}
                  </div>
                  <div className="activity-content">
                    <span className="activity-label">
                      {completedCount === 0
                        ? "START HERE"
                        : "CURRENT STEP"}
                    </span>
                    <h3>{currentAgent.shortTitle}</h3>
                    <p>{currentAgent.description}</p>
                  </div>
                  <button
                    className="activity-action"
                    type="button"
                    onClick={() => openAgent(currentAgent.id)}
                  >
                    Start / Continue →
                  </button>
                </div>
              )}

              {nextAgent && currentAgent && (
                <div className="activity-card glass">
                  <div className="activity-icon">
                    {nextAgent.icon}
                  </div>
                  <div className="activity-content">
                    <span className="activity-label">
                      NEXT STEP
                    </span>
                    <h3>{nextAgent.shortTitle}</h3>
                    <p>{nextAgent.description}</p>
                  </div>
                  <button
                    className="activity-action secondary-action"
                    type="button"
                    onClick={() => openAgent(nextAgent.id)}
                  >
                    Explore →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="agents-section">
          <div className="agents-title-row">
            <div>
              <p className="section-label">
                MULTI-AGENT SYSTEM
              </p>
              <h2>Explore Career Agents</h2>
            </div>
            <p className="agents-small-text">
              {allAgentsCompleted
                ? "All career agents completed successfully."
                : "Complete each agent to improve your career readiness."}
            </p>
          </div>

          <div className="agents-grid">
            {agents.map((agent) => {
              const isCompleted = completedAgents.includes(agent.id);
              const isCurrent =
                currentAgent && currentAgent.id === agent.id;

              return (
                <div
                  className={`agent-card glass ${
                    isCompleted ? "agent-completed" : ""
                  } ${isCurrent ? "agent-current" : ""}`}
                  key={agent.id}
                >
                  <div className="agent-top">
                    <div className="agent-icon">{agent.icon}</div>
                    <span className="agent-number">
                      {isCompleted
                        ? `✓ AGENT ${agent.id} COMPLETED`
                        : agent.id}
                    </span>
                  </div>
                  <h3>{agent.title}</h3>
                  <p>{agent.description}</p>
                  <button
                    className="open-agent-btn"
                    type="button"
                    onClick={() => openAgent(agent.id)}
                  >
                    {isCompleted
                      ? "Completed ✓"
                      : isCurrent
                      ? "Continue →"
                      : "Open Agent"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;