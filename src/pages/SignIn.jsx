import React, { useState } from "react";
import { signIn } from "../store/actions.js";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = signIn(email, password);
      if (success) {
        navigate(location.state?.from?.pathname || "/");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Sign in failed");
    }
  };

  return (
    <div
      className="container"
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "2rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "900",
              background:
                "linear-gradient(135deg, var(--money-green), var(--money-green-dark))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.5rem",
            }}
          >
            SAVE-MY-WAY
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>Welcome back</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: "var(--danger-bg)",
                color: "var(--danger)",
                padding: "1rem",
                borderRadius: "12px",
                marginBottom: "1rem",
                borderLeft: "4px solid var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
          >
            Sign In
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a
            href="/signup"
            className="signup-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "1rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              border: "2px solid transparent",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/signup");
            }}
          >
            <FaArrowLeft
              style={{ marginRight: "0.5rem", transition: "color 0.3s ease" }}
            />
            Need an account? Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
