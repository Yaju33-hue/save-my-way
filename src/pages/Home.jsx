import React, { useEffect } from "react";
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

  useEffect(() => {
    document.title = "SaveMyWay — Home";
  }, []);

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
            aria-label={hideBalance ? "Show balance" : "Hide balance"}
          >
            {hideBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <div className="home-summary-grid">
        <div
          className="home-summary-card clickable-card"
          onClick={() => navigate("/wallet")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/wallet")}
        >
          <div className="summary-card-header">
            <div className="summary-icon wallet-summary-icon">
              <FaWallet />
            </div>
            <span className="summary-card-tag">Cash Flow</span>
          </div>

          <p className="summary-title">Wallet</p>
          <CurrencyFormatter
            amount={hideBalance ? 0 : walletTotal}
            className="summary-amount"
          />
        </div>

        <div
          className="home-summary-card clickable-card"
          onClick={() => navigate("/savings")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/savings")}
        >
          <div className="summary-card-header">
            <div className="summary-icon savings-summary-icon">
              <FaPiggyBank />
            </div>
            <span className="summary-card-tag">Yield</span>
          </div>

          <p className="summary-title">Savings</p>
          <CurrencyFormatter
            amount={hideBalance ? 0 : savingsTotal}
            className="summary-amount"
          />
        </div>

        <div
          className="home-summary-card clickable-card"
          onClick={() => navigate("/investments")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/investments")}
        >
          <div className="summary-card-header">
            <div className="summary-icon investments-summary-icon">
              <FaUniversity />
            </div>
            {!hideBalance && state.data.investmentsEntries && state.data.investmentsEntries.length > 0 && (
              <span
                className={`summary-badge ${
                  totalInvestmentProfitLoss >= 0 ? "badge-profit" : "badge-loss"
                }`}
              >
                {totalInvestmentProfitLoss >= 0 ? "Gain" : "Loss"}
              </span>
            )}
          </div>

          <p className="summary-title">Investments</p>
          <CurrencyFormatter
            amount={hideBalance ? 0 : investmentsTotal}
            className="summary-amount"
          />
        </div>
      </div>

      {totalInterest > 0 && (
        <div className="interest-summary-card">
          <div className="interest-summary-content">
            <span className="interest-summary-title">Total Interest Accrued</span>
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
