import React from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { toggleHideBalance } from "../store/actions.js";
import {
  selectWalletTotal,
  selectSavingsTotal,
  selectTotalInterest,
  selectInvestmentsTotal,
  selectInvestmentProfitLoss,
} from "../store/selectors.js";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import {
  FaWallet,
  FaPiggyBank,
  FaUniversity,
  FaChartLine,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const state = useReactor(store);
  const walletTotal = useSelector(store, selectWalletTotal);
  const savingsTotal = useSelector(store, selectSavingsTotal);
  const investmentsTotal = useSelector(store, selectInvestmentsTotal);
  const totalInterest = useSelector(store, selectTotalInterest);
  const totalInvestmentProfitLoss = useSelector(store, selectInvestmentProfitLoss);
  const hideBalance = state.ui.hideBalance;

  const navigate = useNavigate();

  const netWorth = walletTotal + savingsTotal + investmentsTotal;

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
            className="home-networth"
          />

          <button
            className="balance-toggle-btn"
            onClick={toggleHideBalance}
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
            className="summary-amount"
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
            className="summary-amount"
          />
        </div>

        {/* INVESTMENTS */}
        <div
          className="home-summary-card clickable-card"
          onClick={() => navigate("/investments")}
        >
          <div className="summary-icon investments-summary-icon">
            <FaUniversity />
          </div>

          <p>Investments</p>
          <CurrencyFormatter
            amount={hideBalance ? 0 : investmentsTotal}
            className="summary-amount"
          />
          <p
            style={{
              color: totalInvestmentProfitLoss >= 0 ? "var(--money-green)" : "var(--danger)",
              marginTop: "0.5rem",
              fontWeight: 700,
            }}
          >
            {totalInvestmentProfitLoss >= 0 ? "Profit" : "Loss"}
          </p>
        </div>
      </div>

      {totalInterest > 0 && (
        <div className="interest-summary-card">
          <div>
            <p>Total Interest Accrued</p>
            <CurrencyFormatter
              amount={hideBalance ? 0 : totalInterest}
              className="interest-summary-amount"
            />
          </div>
        </div>
      )}
    </div>
  );
}
