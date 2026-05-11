import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, phone, email, password } = formData;

    // Basic validation
    if (!name || !phone || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const userData = {
        id: Date.now().toString(),
        name,
        phone,
        email,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("save-my-way-user", JSON.stringify(userData));
      signUp(email, password); // Keep existing auth flow
      navigate("/");
    } catch (err) {
      setError("Sign up failed");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          <p style={{ color: "var(--text-secondary)" }}>
            Track your expenses, save smarter
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: "#ffebee",
                color: "#c62828",
                padding: "1rem",
                borderRadius: "12px",
                marginBottom: "1rem",
                borderLeft: "4px solid #ff4757",
              }}
            >
              {error}
            </div>
          )}

          {/* NEW: Name Field */}
          <div className="form-group">
            <label className="label">Full Name</label>
            <input
              type="text"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required
            />
          </div>

          {/* NEW: Phone Field */}
          <div className="form-group">
            <label className="label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+234 800 000 0000"
              pattern="[0-9+\s]{10,}"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
          >
            Create Account
          </button>
        </form>

        {/* NEW GREEN HOVER LINK */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a
            href="/signin"
            className="signin-link"
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
              navigate("/signin");
            }}
          >
            <FaArrowLeft
              style={{ marginRight: "0.5rem", transition: "color 0.3s ease" }}
            />
            Already have an account? Sign In
          </a>
        </div>
      </div>
    </div>
  );
}