import "./Landing.css";

function Landing({ onLogin, onSignup }) {
  return (
    <div className="landing-page">
      <div className="landing-glow landing-glow-1"></div>
      <div className="landing-glow landing-glow-2"></div>

      <div className="landing-content">

        {/* LOGO */}
        <div className="landing-logo">
          <h1>CARA</h1>
          <p>Multi-Agent Career Readiness Framework</p>
        </div>

        {/* HERO */}
        <div className="landing-hero">

          <h2>
            Build Your Career.
            <br />
            <span>Understand Your Potential.</span>
          </h2>

          <p>
            CARA combines multiple intelligent AI agents to analyze
            your resume, verify skills, create personalized learning
            paths, conduct adaptive mock interviews, and provide
            career insights.
          </p>

          {/* GET STARTED BUTTON */}
          <button
            className="get-started-btn"
            onClick={onLogin}
          >
            Get Started →
          </button>

          <p className="landing-features">
            Intelligent • Personalized • Explainable
          </p>

          <div className="signup-section">
            <span>New to CARA?</span>

            <button
              className="signup-link"
              onClick={onSignup}
            >
              Create Account
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Landing;