import React, { useState } from "react";
import { useData } from "../contexts/DataContext.jsx";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import {
  FaWallet,
  FaPiggyBank,
  FaChartLine,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { walletTotal, savingsTotal, totalInterest } = useData();
  const [hideBalance, setHideBalance] = useState(false);

  const navigate = useNavigate();

  const netWorth = walletTotal + savingsTotal;

  return (
    <div className="home-page">
      <div className="home-networth-card">
        <div className="home-icon">
          <FaChartLine />
        </div>

        <p className="home-label">Cash Net Worth</p>

        <div className="balance-row">
          <CurrencyFormatter
            amount={hideBalance ? 0 : netWorth}
            className={`home-networth ${hideBalance ? "balance-hidden" : ""}`}
          />

          <button
            className="balance-toggle-btn"
            onClick={() => setHideBalance(!hideBalance)}
            type="button"
          >
            {hideBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <div className="home-summary-grid">
        {/* WALLET */}
        <div
          className="home-summary-card clickable-card"
          onClick={() => navigate("/wallet")}
        >
          <div className="summary-icon wallet-summary-icon">
            <FaWallet />
          </div>

          <p>Wallet</p>
          <CurrencyFormatter
            amount={hideBalance ? 0 : walletTotal}
            className={`summary-amount ${hideBalance ? "balance-hidden" : ""}`}
          />
        </div>

        {/* SAVINGS */}
        <div
          className="home-summary-card clickable-card"
          onClick={() => navigate("/savings")}
        >
          <div className="summary-icon savings-summary-icon">
            <FaPiggyBank />
          </div>

          <p>Savings</p>
          <CurrencyFormatter
            amount={hideBalance ? 0 : savingsTotal}
            className={`summary-amount ${hideBalance ? "balance-hidden" : ""}`}
          />
        </div>
      </div>

      {totalInterest > 0 && (
        <div className="interest-summary-card">
          <div>
            <p>Total Interest Accrued</p>
            <CurrencyFormatter
              amount={hideBalance ? 0 : totalInterest}
              className={`interest-summary-amount ${
                hideBalance ? "balance-hidden" : ""
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
