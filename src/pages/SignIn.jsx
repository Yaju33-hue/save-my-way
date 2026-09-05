import React, { useState, useEffect } from "react";
import { signIn } from "../store/actions.js";
import { useNavigate, useLocation } from "react-router-dom";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "SaveMyWay — Sign In";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = signIn(email, password);
      if (success) {
        navigate(location.state?.from?.pathname || "/", { replace: true });
      } else {
        setError("Invalid email or password. Don't have an account? Sign up below.");
      }
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">SAVE-MY-WAY</h1>
          <p className="auth-subtitle">Welcome back! Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => navigate("/signup")}
          >
            Don&apos;t have an account? Sign Up &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
