import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useData } from "../contexts/DataContext.jsx";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import { FaSignOutAlt, FaCog, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Account({ onLogout }) {
  const { user } = useAuth();
  const { theme, toggleTheme, currency, updateCurrency, hideBalance } =
    useTheme();
  const { walletTotal, savingsTotal } = useData();

  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const currencyRef = useRef(null);

  const currencies = ["NGN", "USD", "EUR", "GBP", "GHS"];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      onLogout();
    }
  };

  return (
    <div className="account-page">
     

      <div className="card account-card">
        <h2 className="section-title">Profile</h2>

        <div className="account-info-row">
          <span>Email</span>
          <strong>{user?.email}</strong>
        </div>

        <div className="account-info-row">
          <span>Member since</span>
          <strong>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "N/A"}
          </strong>
        </div>
      </div>

      <div className="card account-card">
        <h2 className="section-title">App Summary</h2>

        <div className="account-summary-grid">
          <div className="account-summary-box">
            <span>Wallet Total</span>
            <br></br>
            <CurrencyFormatter amount={walletTotal} />
          </div>

          <div className="account-summary-box">
            <span>Savings Total</span> 
            <br></br>
            <CurrencyFormatter amount={savingsTotal} />
          </div>
        </div>

        <div className="account-info-row">
          <span>Hide Balance</span>
          <strong className={hideBalance ? "status-hidden" : "status-visible"}>
            {hideBalance ? "Hidden" : "Visible"}
          </strong>
        </div>
      </div>

      <div className="card account-card">
        <div className="settings-header">
          <h2 className="section-title">Settings</h2>

          <button
            className="settings-btn"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            <FaCog />
          </button>
        </div>

        {showSettings && (
          <div className="settings-content">
            <div className="custom-dropdown" ref={currencyRef}>
              <button
                type="button"
                className={`custom-dropdown-btn ${currencyOpen ? "open" : ""}`}
                onClick={() => setCurrencyOpen((prev) => !prev)}
              >
                <span>{currency}</span>
                <span className="dropdown-arrow">⌄</span>
              </button>

              {currencyOpen && (
                <div className="custom-dropdown-menu">
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      className={`custom-dropdown-option ${
                        currency === curr ? "selected" : ""
                      }`}
                      onClick={() => {
                        updateCurrency(curr);
                        setCurrencyOpen(false);
                      }}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="toggle-row">
              <span>Dark Mode</span>

              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="logout-wrap">
        <button className="btn btn-danger logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
}
