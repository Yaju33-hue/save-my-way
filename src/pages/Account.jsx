import React, { useState, useRef, useEffect } from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import {
  toggleTheme,
  updateCurrency,
  signOut,
  toggleHideBalance,
  refreshRates,
} from "../store/actions.js";
import { selectWalletTotal, selectSavingsTotal, selectInvestmentsTotal } from "../store/selectors.js";
import { getExchangeRates } from "../utils/currency.js";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import { FaSignOutAlt, FaCog, FaSyncAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const state = useReactor(store);
  const user = state.auth.user;
  const theme = state.ui.theme;
  const currency = state.ui.currency;
  const hideBalance = state.ui.hideBalance;
  const navigate = useNavigate();
  const walletTotal = useSelector(store, selectWalletTotal);
  const savingsTotal = useSelector(store, selectSavingsTotal);
  const investmentsTotal = useSelector(store, selectInvestmentsTotal);

  const [showSettings, setShowSettings] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const currencyRef = useRef(null);

  const currencies = ["NGN", "USD", "EUR", "GBP", "GHS"];
  const rates = getExchangeRates();

  useEffect(() => {
    document.title = "SaveMyWay — Account";
  }, []);

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
      signOut();
      navigate("/signin", { replace: true });
    }
  };

  const handleSyncRates = async () => {
    setSyncing(true);
    await refreshRates();
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <div className="account-page">
      <div className="card account-card">
        <h2 className="section-title">Profile</h2>

        {user?.name && (
          <div className="account-info-row">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>
        )}

        <div className="account-info-row">
          <span>Email</span>
          <strong>{user?.email || "Not signed in"}</strong>
        </div>

        {user?.phone && (
          <div className="account-info-row">
            <span>Phone</span>
            <strong>{user.phone}</strong>
          </div>
        )}

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
            <span className="account-box-label">Total Wallet</span>
            <CurrencyFormatter amount={walletTotal} className="summary-amount" />
          </div>

          <div className="account-summary-box">
            <span className="account-box-label">Total Savings</span>
            <CurrencyFormatter amount={savingsTotal} className="summary-amount" />
          </div>

          <div className="account-summary-box">
            <span className="account-box-label">Total Investments</span>
            <CurrencyFormatter amount={investmentsTotal} className="summary-amount" />
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
            className={`settings-btn ${showSettings ? "open" : ""}`}
            onClick={() => setShowSettings((prev) => !prev)}
            aria-label="Toggle settings"
          >
            <FaCog />
          </button>
        </div>

        {showSettings && (
          <div className="settings-content">
            <div className="form-group">
              <label className="settings-field-label">Active Display Currency</label>
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
            </div>

            <div className="rates-info-card">
              <div className="rates-header">
                <span className="rates-title">Live Market Rates (USD Base)</span>
                <button
                  type="button"
                  className="rates-sync-btn"
                  onClick={handleSyncRates}
                  disabled={syncing}
                >
                  <FaSyncAlt className={syncing ? "spinning" : ""} />
                  {syncing ? "Syncing..." : "Sync Rates"}
                </button>
              </div>
              <p className="rates-text">
                $1 USD = ₦{rates.NGN?.toFixed(2)} NGN • €{rates.EUR?.toFixed(4)} EUR • £{rates.GBP?.toFixed(4)} GBP • ₵{rates.GHS?.toFixed(2)} GHS
              </p>
            </div>

            <div className="toggle-row">
              <span>Dark Mode</span>

              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                  aria-label="Toggle dark mode"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <span>Hide Balance</span>

              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={hideBalance}
                  onChange={toggleHideBalance}
                  aria-label="Toggle hide balance"
                />
                <span className="toggle-slider"></span>
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
