import React, { useEffect, useRef, useState } from "react";
import "./MockInterviewAgent.css";

const AGENT5_URL = "http://localhost:8005/api/agent5";

const TOTAL_QUESTIONS = 10;
const QUESTION_TIME = 120;

/* =====================================================
   SAVED DATA
===================================================== */

function getSavedRole() {
  return (
    localStorage.getItem("target_role") ||
    localStorage.getItem("desiredRole") ||
    localStorage.getItem("careerRole") ||
    localStorage.getItem("selectedRole") ||
    "Software Engineer"
  );
}

function getSavedResume() {
  return (
    localStorage.getItem("savedResumeText") ||
    localStorage.getItem("resumeText") ||
    ""
  );
}

/* =====================================================
   COMPONENT
===================================================== */

export default function MockInterviewAgent() {
  const [role, setRole] = useState(getSavedRole());
  const [resumeText, setResumeText] =
    useState(getSavedResume());

  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] =
    useState(1);

  const [totalQuestions, setTotalQuestions] =
    useState(TOTAL_QUESTIONS);

  const [difficulty, setDifficulty] =
    useState("Adaptive");

  const [answer, setAnswer] = useState("");

  const [timeLeft, setTimeLeft] =
    useState(QUESTION_TIME);

  const [started, setStarted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [speaking, setSpeaking] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);

  const recognitionRef =
    useRef(null);

  /* =====================================================
     BACK TO DASHBOARD
  ===================================================== */

  function goToDashboard() {
    window.dispatchEvent(
      new CustomEvent(
        "cara-back-to-dashboard"
      )
    );
  }

  /* =====================================================
     TIMER
  ===================================================== */

  useEffect(() => {
    if (
      !started ||
      result ||
      loading
    ) {
      return;
    }

    if (timeLeft <= 0) {
      submitAnswer(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(
        (previous) =>
          previous - 1
      );
    }, 1000);

    return () =>
      clearTimeout(timer);
  }, [
    started,
    timeLeft,
    result,
    loading,
  ]);

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();

      if (
        recognitionRef.current
      ) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  function formatTime(seconds) {
    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      secs
    ).padStart(
      2,
      "0"
    )}`;
  }

  /* =====================================================
     START INTERVIEW
  ===================================================== */

  async function startInterview() {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswer("");
    setQuestion("");
    setQuestionNumber(1);
    setTimeLeft(
      QUESTION_TIME
    );

    try {
      const response =
        await fetch(
          `${AGENT5_URL}/start`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              role:
                role ||
                "Software Engineer",

              resume_text:
                resumeText || "",

              question_number: 1,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Agent 5 is not responding."
        );
      }

      const data =
        await response.json();

      setQuestion(
        data.question ||
          "Tell me about yourself."
      );

      setQuestionNumber(
        data.question_number ||
          1
      );

      setTotalQuestions(
        data.total_questions ||
          TOTAL_QUESTIONS
      );

      setDifficulty(
        data.difficulty ||
          "Adaptive"
      );

      setStarted(true);
    } catch (err) {
      console.error(err);

      setError(
        "Agent 5 is not responding. Please make sure the Agent 5 backend is running on port 8005."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     SUBMIT ANSWER
  ===================================================== */

  async function submitAnswer(
    autoSubmit = false
  ) {
    if (
      loading ||
      result
    ) {
      return;
    }

    if (
      !answer.trim() &&
      !autoSubmit
    ) {
      setError(
        "Please enter or speak your answer first."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `${AGENT5_URL}/answer`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              role:
                role ||
                "Software Engineer",

              resume_text:
                resumeText || "",

              question_number:
                questionNumber,

              question:
                question,

              answer:
                answer.trim(),
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to submit answer."
        );
      }

      const data =
        await response.json();

      /* =================================================
         FINAL RESULT
      ================================================= */

      if (
        data.finished === true ||
        data.completed === true ||
        data.result
      ) {
        const finalResult =
          data.result || data;

        /* ---------------------------------------------
           GET ACTUAL INTERVIEW SCORE
        --------------------------------------------- */

        const interviewScore =
          Number(
            finalResult.score ??
              finalResult.overall_score ??
              finalResult.overallScore ??
              finalResult.rating ??
              0
          );

        /* ---------------------------------------------
           CONVERT /10 TO /100
           FOR AGENT 6
        --------------------------------------------- */

        const dashboardScore =
          Math.max(
            0,
            Math.min(
              100,
              Math.round(
                interviewScore * 10
              )
            )
          );

        /* ---------------------------------------------
           SHOW RESULT
        --------------------------------------------- */

        setResult(
          finalResult
        );

        /* ---------------------------------------------
           SAVE COMPLETION
        --------------------------------------------- */

        localStorage.setItem(
          "agent5_completed",
          "true"
        );

        localStorage.setItem(
          "cara_agent5_completed",
          "true"
        );

        /* ---------------------------------------------
           SAVE SCORE
        --------------------------------------------- */

        localStorage.setItem(
          "cara_agent5_score",
          String(
            dashboardScore
          )
        );

        localStorage.setItem(
          "cara_agent5_scores",
          JSON.stringify({
            agent5:
              dashboardScore,

            score:
              dashboardScore,

            completed:
              true,
          })
        );

        /* ---------------------------------------------
           SAVE FULL RESULT
        --------------------------------------------- */

        localStorage.setItem(
          "cara_agent5_result",
          JSON.stringify(
            finalResult
          )
        );

        /* ---------------------------------------------
           DASHBOARD EVENT
        --------------------------------------------- */

        window.dispatchEvent(
          new CustomEvent(
            "agent-completed",
            {
              detail: {
                agentId: "05",

                completed:
                  true,

                score:
                  dashboardScore,
              },
            }
          )
        );

        setStarted(false);
        setLoading(false);

        window.speechSynthesis?.cancel();

        return;
      }

      /* =================================================
         NEXT QUESTION
      ================================================= */

      setQuestion(
        data.question ||
          data.next_question ||
          "Please continue with your answer."
      );

      setQuestionNumber(
        data.question_number ||
          Math.min(
            questionNumber + 1,
            totalQuestions
          )
      );

      setTotalQuestions(
        data.total_questions ||
          totalQuestions
      );

      setDifficulty(
        data.difficulty ||
          "Adaptive"
      );

      setAnswer("");

      setTimeLeft(
        QUESTION_TIME
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to submit the answer. Please check that Agent 5 is running on port 8005."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     GET SCORE
  ===================================================== */

  function getScore() {
    if (!result) {
      return 0;
    }

    return (
      result.score ??
      result.overall_score ??
      result.overallScore ??
      result.rating ??
      0
    );
  }

  /* =====================================================
     TEXT TO SPEECH
  ===================================================== */

  function readQuestion() {
    if (
      !question ||
      !window.speechSynthesis
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        question
      );

    speech.rate = 0.92;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onstart = () => {
      setSpeaking(true);
    };

    speech.onend = () => {
      setSpeaking(false);
    };

    speech.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(
      speech
    );
  }

  /* =====================================================
     SPEECH RECOGNITION
  ===================================================== */

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Please use Chrome."
      );

      return;
    }

    if (
      listening &&
      recognitionRef.current
    ) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "en-US";

    recognition.continuous =
      true;

    recognition.interimResults =
      true;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };

    recognition.onresult =
      (event) => {
        let finalText = "";

        for (
          let i =
            event.resultIndex;
          i <
            event.results
              .length;
          i++
        ) {
          finalText +=
            event.results[i][0]
              .transcript;
        }

        setAnswer(
          (previous) => {
            const cleanedPrevious =
              previous.trim();

            if (
              !cleanedPrevious
            ) {
              return finalText.trim();
            }

            return `${cleanedPrevious} ${finalText.trim()}`;
          }
        );
      };

    recognition.onerror =
      (event) => {
        console.error(
          "Speech recognition error:",
          event.error
        );

        setListening(false);
      };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current =
      recognition;

    recognition.start();
  }

  /* =====================================================
     RESTART INTERVIEW
  ===================================================== */

  function restartInterview() {
    window.speechSynthesis?.cancel();

    if (
      recognitionRef.current
    ) {
      recognitionRef.current.stop();
    }

    setResult(null);
    setStarted(false);
    setQuestion("");
    setAnswer("");
    setQuestionNumber(1);
    setTimeLeft(
      QUESTION_TIME
    );
    setError("");
  }

  /* =====================================================
     RESULT HELPERS
  ===================================================== */

  function getStrengths() {
    if (!result) {
      return [];
    }

    const value =
      result.strengths ||
      result.Strengths ||
      [];

    return Array.isArray(
      value
    )
      ? value
      : [value];
  }

  function getImprovements() {
    if (!result) {
      return [];
    }

    const value =
      result.areas_to_improve ||
      result.areasToImprove ||
      result.improvements ||
      result.weaknesses ||
      [];

    return Array.isArray(
      value
    )
      ? value
      : [value];
  }

  function getPlan() {
    if (!result) {
      return [];
    }

    const value =
      result.improvement_plan ||
      result.improvementPlan ||
      result.action_plan ||
      [];

    return Array.isArray(
      value
    )
      ? value
      : [value];
  }

  /* =====================================================
     RESULT SCREEN
  ===================================================== */

  if (result) {
    const score =
      getScore();

    const strengths =
      getStrengths();

    const improvements =
      getImprovements();

    const plan =
      getPlan();

    return (
      <div className="agent5-page">

        <div className="agent5-glow glow-one"></div>

        <div className="agent5-glow glow-two"></div>

        <div className="agent5-result">

          {/* AVATAR */}

          <div className="result-avatar">

            <div className="avatar-head">

              <div className="avatar-hair"></div>

              <div className="avatar-eye left"></div>

              <div className="avatar-eye right"></div>

              <div className="avatar-mouth"></div>

            </div>

            <div className="avatar-body">

              <div className="avatar-tie"></div>

            </div>

          </div>

          {/* COMPLETION */}

          <div className="result-label">
            ✓ INTERVIEW COMPLETED
          </div>

          <div className="agent5-completed-badge">
            AGENT 5 COMPLETED
          </div>

          <h1>
            Your Interview Assessment
          </h1>

          <p className="result-subtitle">
            Here is your overall interview
            assessment.
          </p>

          {/* SCORE */}

          <div className="score-ring">

            <div>

              <strong>
                {score}
              </strong>

              <span>
                /10
              </span>

            </div>

          </div>

          <p className="score-title">
            Overall Interview Score
          </p>

          {/* RESULT CARDS */}

          <div className="result-grid">

            {/* STRENGTHS */}

            <div className="result-card">

              <div className="result-card-icon">
                💪
              </div>

              <h3>
                Strengths
              </h3>

              {strengths.length >
              0 ? (

                <ul>

                  {strengths.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={
                          index
                        }
                      >
                        {item}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  Your interview
                  responses have
                  been evaluated
                  successfully.
                </p>

              )}

            </div>

            {/* IMPROVEMENTS */}

            <div className="result-card">

              <div className="result-card-icon">
                🎯
              </div>

              <h3>
                Areas to Improve
              </h3>

              {improvements.length >
              0 ? (

                <ul>

                  {improvements.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={
                          index
                        }
                      >
                        {item}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  Continue
                  practising
                  technical and
                  communication
                  questions.
                </p>

              )}

            </div>

            {/* IMPROVEMENT PLAN */}

            <div className="result-card">

              <div className="result-card-icon">
                🚀
              </div>

              <h3>
                Improvement Plan
              </h3>

              {plan.length >
              0 ? (

                <ul>

                  {plan.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={
                          index
                        }
                      >
                        {item}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  Practise regularly
                  and review your
                  interview responses.
                </p>

              )}

            </div>

          </div>

          {/* BUTTONS */}

          <div className="agent5-result-actions">

            <button
              className="secondary-button"
              onClick={
                goToDashboard
              }
              type="button"
            >
              ← Back to Dashboard
            </button>

            <button
              className="primary-button result-button"
              onClick={
                restartInterview
              }
              type="button"
            >
              Start New Interview
            </button>

          </div>

        </div>

      </div>
    );
  }

  /* =====================================================
     WELCOME SCREEN
  ===================================================== */

  if (!started) {
    return (
      <div className="agent5-page">

        <div className="agent5-glow glow-one"></div>

        <div className="agent5-glow glow-two"></div>

        <div className="agent5-welcome">

          <div className="welcome-badge">
            ✦ CARA AGENT 5
          </div>

          <div className="welcome-avatar">

            <div className="avatar-head">

              <div className="avatar-hair"></div>

              <div className="avatar-eye left"></div>

              <div className="avatar-eye right"></div>

              <div className="avatar-mouth"></div>

            </div>

            <div className="avatar-body">

              <div className="avatar-tie"></div>

            </div>

          </div>

          <h1>
            AI Mock Interview
          </h1>

          <p>
            Context-Aware Adaptive Mock
            Interview Agent
          </p>

          <div className="setup-card">

            <label>
              Target Role
            </label>

            <input
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value
                )
              }
              placeholder="Example: AI/ML Engineer"
            />

            <div className="setup-info">

              <span>
                🤖 AI-powered
              </span>

              <span>
                🎯 Resume-aware
              </span>

              <span>
                ⏱️ 120 sec/question
              </span>

              <span>
                🔢 10 questions
              </span>

            </div>

          </div>

          {error && (
            <div className="agent5-error">
              {error}
            </div>
          )}

          <div className="agent5-button-row">

            <button
              className="secondary-button"
              onClick={
                goToDashboard
              }
              type="button"
            >
              ← Back to Dashboard
            </button>

            <button
              className="primary-button start-button"
              onClick={
                startInterview
              }
              disabled={
                loading
              }
              type="button"
            >
              {loading
                ? "Starting Interview..."
                : "Start Interview →"}
            </button>

          </div>

        </div>

      </div>
    );
  }

  /* =====================================================
     INTERVIEW SCREEN
  ===================================================== */

  const progress =
    (questionNumber /
      totalQuestions) *
    100;

  return (
    <div className="agent5-page">

      <div className="agent5-glow glow-one"></div>

      <div className="agent5-glow glow-two"></div>

      <div className="agent5-interview">

        {/* TOP BAR */}

        <div className="interview-topbar">

          <div className="brand">

            <div className="brand-mark">
              C
            </div>

            <div>
              <strong>
                CARA
              </strong>

              <span>
                AI INTERVIEWER
              </span>
            </div>

          </div>

          <div className="role-pill">
            {role}
          </div>

          <div className="question-counter">

            <strong>
              {questionNumber}
            </strong>

            <span>
              / {totalQuestions}
            </span>

          </div>

        </div>

        {/* PROGRESS */}

        <div className="progress-section">

          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            ></div>

          </div>

          <div className="progress-label">
            Question{" "}
            {questionNumber}{" "}
            of{" "}
            {totalQuestions}
          </div>

        </div>

        {/* TIMER */}

        <div
          className={`timer ${
            timeLeft <= 20
              ? "timer-warning"
              : ""
          }`}
        >
          ⏱{" "}
          {formatTime(
            timeLeft
          )}
        </div>

        {/* AVATAR */}

        <div className="interviewer-avatar">

          <div className="avatar-head large">

            <div className="avatar-hair"></div>

            <div className="avatar-eye left"></div>

            <div className="avatar-eye right"></div>

            <div className="avatar-mouth"></div>

          </div>

          <div className="avatar-body large-body">

            <div className="avatar-tie"></div>

          </div>

          <div className="avatar-status">

            <span></span>

            AI INTERVIEWER

          </div>

        </div>

        {/* QUESTION */}

        <div className="question-card">

          <div className="question-top">

            <span className="question-label">
              AI INTERVIEWER
            </span>

            <span className="difficulty">
              ✦{" "}
              {difficulty}
            </span>

          </div>

          <h1>
            {question}
          </h1>

          <button
            className={`read-button ${
              speaking
                ? "active"
                : ""
            }`}
            onClick={
              readQuestion
            }
            type="button"
          >
            🔊{" "}
            {speaking
              ? "Reading Question..."
              : "Read Question"}
          </button>

        </div>

        {/* ANSWER */}

        <div className="answer-section">

          <div className="answer-header">

            <label>
              Your Answer
            </label>

            <span>
              {answer.length}{" "}
              characters
            </span>

          </div>

          <div className="answer-box">

            <textarea
              value={answer}
              onChange={(e) =>
                setAnswer(
                  e.target.value
                )
              }
              placeholder="Type your answer here, or use the microphone to speak..."
              disabled={
                loading
              }
            />

            <div className="answer-actions">

              <button
                className={`voice-button ${
                  listening
                    ? "listening"
                    : ""
                }`}
                onClick={
                  startListening
                }
                type="button"
              >
                {listening
                  ? "🔴 Listening..."
                  : "🎤 Speak Answer"}
              </button>

              <button
                className="submit-button"
                onClick={() =>
                  submitAnswer(
                    false
                  )
                }
                disabled={
                  loading
                }
                type="button"
              >
                {loading
                  ? "Evaluating..."
                  : questionNumber >=
                    totalQuestions
                  ? "Finish Interview ✓"
                  : "Submit Answer →"}
              </button>

            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="agent5-error interview-error">
            {error}
          </div>
        )}

        {/* FOOTER */}

        <div className="interview-footer">

          <span>
            ✦ Your responses are
            evaluated by CARA AI
          </span>

          <span>
            Question{" "}
            {questionNumber}/
            {totalQuestions}
          </span>

        </div>

      </div>

    </div>
  );
}