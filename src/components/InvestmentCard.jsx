import React, { useEffect, useRef, useState } from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { formatCurrency } from "../utils/currency.js";
import DropdownMenu from "./DropdownMenu.jsx";

const HIDDEN_VALUE = "****";

export default function InvestmentCard({ entry, onEdit, onDelete }) {
  const state = useReactor(store);
  const hideBalance = state.ui.hideBalance;
  const currency = state.ui.currency;
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef(null);

  const fromCurrency = entry.baseCurrency || "NGN";
  const amount = parseFloat(entry.amount) || 0;
  const currentPrice = parseFloat(entry.currentPrice) || 0;
  const amountSpent = parseFloat(entry.amountSpent) || 0;
  const currentValue = amount * currentPrice;
  const profitLoss = currentValue - amountSpent;
  const profitLossPercent = amountSpent > 0 ? (profitLoss / amountSpent) * 100 : 0;
  const isProfit = profitLoss >= 0;
  const updatedAt = entry.priceUpdatedAt || entry.createdAt;
  const lastUpdatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not updated yet";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="card fade-in-up">
      <div className="entry-card-content">
        <div className="entry-info">
          <h3 className="bold">{hideBalance ? HIDDEN_VALUE : entry.name}</h3>

          <div className="entry-tags">
            <span className="entry-tag">
              Shares: {hideBalance ? HIDDEN_VALUE : amount}
            </span>
            <span className="entry-tag">
              Price: {hideBalance ? HIDDEN_VALUE : formatCurrency(currentPrice, currency, fromCurrency)}
            </span>
            {entry.symbol && !hideBalance && (
              <span className="entry-tag">
                {entry.market}: {entry.symbol}
              </span>
            )}
          </div>

          <p style={{ marginTop: "0.85rem", color: "var(--text-secondary)" }}>
            Spent: {hideBalance ? HIDDEN_VALUE : formatCurrency(amountSpent, currency, fromCurrency)}
          </p>
          <p className="price-updated-label">
            Last updated: {hideBalance ? HIDDEN_VALUE : lastUpdatedLabel}
          </p>
          {entry.priceError && !hideBalance && (
            <p className="price-updated-label price-updated-label--warning">
              Showing last cached price
            </p>
          )}
        </div>

        <div className="entry-amount-wrap">
          <div
            className="amount"
            style={{ color: isProfit ? "var(--money-green)" : "var(--danger)" }}
          >
            {hideBalance ? HIDDEN_VALUE : formatCurrency(currentValue, currency, fromCurrency)}
          </div>

          <div
            style={{
              color: isProfit ? "var(--money-green)" : "var(--danger)",
              fontWeight: 700,
              marginTop: "0.5rem",
            }}
          >
            {isProfit ? "Gain" : "Loss"}:{" "}
            {hideBalance
              ? HIDDEN_VALUE
              : `${formatCurrency(Math.abs(profitLoss), currency, fromCurrency)} (${Math.abs(
                  profitLossPercent,
                ).toFixed(2)}%)`}
          </div>
        </div>

        <div className="dropdown entry-menu" ref={menuRef}>
          <button
            className={`entry-menu-btn ${showDropdown ? "active" : ""}`}
            onClick={() => setShowDropdown((prev) => !prev)}
            type="button"
            aria-label="Open investment menu"
          >
            ...
          </button>

          <DropdownMenu
            isOpen={showDropdown}
            onClose={() => setShowDropdown(false)}
            onEdit={() => onEdit(entry)}
            onDelete={() => onDelete(entry.id)}
          />
        </div>
      </div>
    </div>
  );
}
