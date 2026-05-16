import React from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { deleteInvestmentEntry, toggleHideBalance } from "../store/actions.js";
import {
  selectInvestmentsTotal,
  selectInvestmentProfitLoss,
} from "../store/selectors.js";
import InvestmentCard from "../components/InvestmentCard.jsx";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import { FaPlus, FaUniversity, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

export default function Investments() {
  const state = useReactor(store);
  const investmentEntries = state.data.investmentsEntries || [];
  const investmentsTotal = useSelector(store, selectInvestmentsTotal);
  const totalProfitLoss = useSelector(store, selectInvestmentProfitLoss);
  const hideBalance = state.ui.hideBalance;
  const navigate = useNavigate();

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this investment entry?")) {
      deleteInvestmentEntry(id);
    }
  };

  const isProfit = totalProfitLoss >= 0;

  return (
    <div className="investments-page">
      <div className="investments-balance-card">
        <div className="wallet-icon">
          <FaUniversity />
        </div>

        <p className="wallet-label">Total Investment Value</p>

        <div className="balance-row">
          <CurrencyFormatter
            amount={hideBalance ? 0 : investmentsTotal}
            className="wallet-amount"
          />

          <button
            className="balance-toggle-btn"
            onClick={toggleHideBalance}
            type="button"
          >
            {hideBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <div className="interest-box">
          <span>{isProfit ? "Total Profit" : "Total Loss"}</span>
          <CurrencyFormatter
            amount={hideBalance ? 0 : totalProfitLoss}
            className={`interest-amount ${isProfit ? "profit-text" : "loss-text"}`}
          />
        </div>
      </div>

      <div className="wallet-header">
        <h2>Investments</h2>

        <Link to="/investments/add" className="small-add-btn">
          <FaPlus />
          Add
        </Link>
      </div>

      {investmentEntries.length === 0 ? (
        <div className="empty-state wallet-empty">
          <div className="empty-icon">🏦</div>
          <h3>No investments yet</h3>
          <p>Add your first stock purchase to track your portfolio.</p>

          <Link to="/investments/add" className="btn btn-primary">
            Add Investment
          </Link>
        </div>
      ) : (
        <div className="entries-list">
          {investmentEntries.map((entry) => (
            <InvestmentCard
              key={entry.id}
              entry={entry}
              onEdit={() => navigate(`/investments/edit/${entry.id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Link to="/investments/add" className="fab">
        <FaPlus />
      </Link>
    </div>
  );
}
