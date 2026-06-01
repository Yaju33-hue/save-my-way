import React, { useEffect, useRef, useState } from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { formatCurrency } from "../utils/currency.js";
import DropdownMenu from "./DropdownMenu.jsx";

export default function InvestmentCard({ entry, onEdit, onDelete }) {
  const state = useReactor(store);
  const hideBalance = state.ui.hideBalance;
  const currency = state.ui.currency;
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef(null);

  const amount = parseFloat(entry.amount) || 0;
  const currentPrice = parseFloat(entry.currentPrice) || 0;
  const amountSpent = parseFloat(entry.amountSpent) || 0;
  const currentValue = amount * currentPrice;
  const profitLoss = currentValue - amountSpent;
  const isProfit = profitLoss >= 0;

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
          <h3 className="bold">{hideBalance ? "••••" : entry.name}</h3>

          <div className="entry-tags">
            <span className="entry-tag">
              Shares: {hideBalance ? "••••" : amount}
            </span>
            <span className="entry-tag">
              Price: {hideBalance ? "••••" : formatCurrency(currentPrice, currency)}
            </span>
          </div>

          <p style={{ marginTop: "0.85rem", color: "var(--text-secondary)" }}>
            Spent: {hideBalance ? "••••" : formatCurrency(amountSpent, currency)}
          </p>
        </div>

        <div className="entry-amount-wrap">
          <div
            className="amount"
            style={{ color: isProfit ? "var(--money-green)" : "var(--danger)" }}
          >
            {hideBalance ? "••••" : formatCurrency(currentValue, currency)}
          </div>

          <div
            style={{
              color: isProfit ? "var(--money-green)" : "var(--danger)",
              fontWeight: 700,
              marginTop: "0.5rem",
            }}
          >
            {isProfit ? "Profit" : "Loss"}: {hideBalance ? "••••" : formatCurrency(Math.abs(profitLoss), currency)}
          </div>
        </div>

        <div className="dropdown entry-menu" ref={menuRef}>
          <button
            className={`entry-menu-btn ${showDropdown ? "active" : ""}`}
            onClick={() => setShowDropdown((prev) => !prev)}
            type="button"
            aria-label="Open investment menu"
          >
            ⋮
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
