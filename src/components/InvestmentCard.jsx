import React, { useEffect, useRef, useState } from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import DropdownMenu from "./DropdownMenu.jsx";

const currencySymbols = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "₵",
};

export default function InvestmentCard({ entry, onEdit, onDelete }) {
  const state = useReactor(store);
  const hideBalance = state.ui.hideBalance;
  const currency = state.ui.currency;
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef(null);

  const symbol = currencySymbols[currency] ?? currency;

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

  const formatMoney = (value) =>
    `${symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="card fade-in-up">
      <div className="entry-card-content">
        <div className="entry-info">
          <h3 className="bold">{entry.name}</h3>

          <div className="entry-tags">
            <span className="entry-tag">Shares: {hideBalance ? "****" : amount}</span>
            <span className="entry-tag">Price: {formatMoney(currentPrice)}</span>
          </div>

          <p style={{ marginTop: "0.85rem", color: "var(--text-secondary)" }}>
            Spent: {hideBalance ? "****" : formatMoney(amountSpent)}
          </p>
        </div>

        <div className="entry-amount-wrap">
          <div
            className="amount"
            style={{ color: isProfit ? "var(--money-green)" : "var(--danger)" }}
          >
            {hideBalance ? "****" : formatMoney(currentValue)}
          </div>

          <div
            style={{
              color: isProfit ? "var(--money-green)" : "var(--danger)",
              fontWeight: 700,
              marginTop: "0.5rem",
            }}
          >
            {isProfit ? "Profit" : "Loss"}: {hideBalance ? "****" : formatMoney(Math.abs(profitLoss))}
          </div>
        </div>

        <div className="dropdown entry-menu" ref={menuRef}>
          <button
            className={`entry-menu-btn ${showDropdown ? "active" : ""}`}
            onClick={() => setShowDropdown((prev) => !prev)}
            type="button"
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
