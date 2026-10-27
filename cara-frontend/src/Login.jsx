
import { useState } from "react";

function Login({ onLoginSuccess, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      alert("Please enter your email and password.");
      return;
    }

    // Pass the logged-in user's email to App.jsx.
    // This UI-only login does not verify credentials against a backend.
    if (typeof onLoginSuccess === "function") {
      onLoginSuccess(normalizedEmail);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">CARA</div>

        <h1>Welcome Back</h1>

        <p>
          Sign in to continue your career readiness journey.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit">
            Login
          </button>
        </form>

        <p className="login-note">
          New to CARA?{" "}

          <button
            type="button"
            onClick={onSignup}
            style={{
              background: "none",
              color: "#6c3df4",
              padding: 0,
              border: "none",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;