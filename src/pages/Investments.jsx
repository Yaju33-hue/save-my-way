import React, { useEffect, useRef } from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import {
  deleteInvestmentEntry,
  toggleHideBalance,
  updateInvestmentEntry,
} from "../store/actions.js";
import {
  selectInvestmentsTotal,
  selectInvestmentProfitLoss,
} from "../store/selectors.js";
import { confirmDeleteAction } from "../utils/confirmDialog.js";
import { getStockPrice } from "../utils/marketData.js";
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
  const trackedInvestmentsKey = investmentEntries
    .map((entry) => `${entry.id}:${entry.symbol || ""}:${entry.market || ""}`)
    .join("|");
  const investmentEntriesRef = useRef(investmentEntries);

  useEffect(() => {
    investmentEntriesRef.current = investmentEntries;
  }, [investmentEntries]);

  useEffect(() => {
    document.title = "SaveMyWay — Investments";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshPrices = async () => {
      const trackedEntries = investmentEntriesRef.current.filter(
        (entry) => entry.symbol && entry.market,
      );

      for (const entry of trackedEntries) {
        try {
          const quote = await getStockPrice(entry.symbol, entry.market);
          if (cancelled) return;

          updateInvestmentEntry(entry.id, {
            currentPrice: quote.price,
            priceUpdatedAt: quote.updatedAt,
            priceSource: quote.source,
            priceError: quote.error || "",
          });
        } catch (error) {
          if (cancelled) return;
          updateInvestmentEntry(entry.id, {
            priceError: error.message || "Price refresh failed",
          });
        }
      }
    };

    refreshPrices();

    const interval = window.setInterval(refreshPrices, 3 * 60 * 1000);
    const handleFocus = () => refreshPrices();
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [trackedInvestmentsKey]);

  const handleDelete = (id) => {
    confirmDeleteAction(() => deleteInvestmentEntry(id));
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
            aria-label={hideBalance ? "Show balance" : "Hide balance"}
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
