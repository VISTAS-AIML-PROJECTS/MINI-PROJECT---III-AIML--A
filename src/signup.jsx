
import { useState } from "react";

function Signup({ onSignup, onLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (typeof onSignup === "function") {
      onSignup({
        name: fullName.trim(),
        email: normalizedEmail,
        password,
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">CARA</div>

        <h1>Create Account</h1>
        <p>Start your career readiness journey with CARA.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            placeholder="Enter your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <label htmlFor="signup-confirm-password">
            Confirm Password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <button type="submit">Create Account</button>
        </form>

        <p className="login-note">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLogin}
            style={{
              background: "none",
              color: "#6c3df4",
              padding: 0,
              border: "none",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;