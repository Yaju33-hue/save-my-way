import React, { useState, useRef, useEffect } from "react";
import { FaClock } from "react-icons/fa";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { isPendingRecurringEntry } from "../store/selectors.js";
import { formatCurrency } from "../utils/currency.js";
import DropdownMenu from "./DropdownMenu.jsx";

export default function EntryCard({
  entry,
  onEdit,
  onDelete,
  type = "wallet",
}) {
  const state = useReactor(store);
  const hideBalance = state.ui.hideBalance;
  const currency = state.ui.currency;
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeColor = (entryType) => {
    if (entryType === "incoming") return "var(--money-green)";
    if (entryType === "outgoing") return "var(--danger)";
    return "var(--text-primary)";
  };

  const isPending = isPendingRecurringEntry(entry);
  const formattedAmount = hideBalance
    ? "••••"
    : formatCurrency(entry.amount, currency, entry.baseCurrency || "NGN");

  return (
    <div className={`card fade-in-up ${showDropdown ? "card--menu-open" : ""}`}>
      <div className="entry-card-content">
        <div className="entry-info">
          <h3 className="bold">{entry.name}</h3>
          {type === "savings" && entry.interestRate && (
            <p className="entry-interest-rate">
              {hideBalance ? "••••" : `${entry.interestRate}% p.a.`}
            </p>
          )}
          {(type === "wallet" || entry.recurring) && (
            <div className="entry-tags">
              {type === "wallet" && (
                <span className="entry-tag" style={{ color: getTypeColor(entry.type) }}>
                  {hideBalance ? "••••" : entry.type?.toUpperCase()}
                </span>
              )}

              {entry.recurring && (
                <span className={`recurring-tag ${isPending ? "pending-recurring" : ""}`}>
                  RECURRING
                  {isPending && <FaClock className="clock-icon" />}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="entry-amount-wrap">
          <div className="amount" style={{ color: getTypeColor(entry.type) }}>
            {formattedAmount}
          </div>
        </div>

        <div className="dropdown entry-menu" ref={menuRef}>
          <button
            className={`entry-menu-btn ${showDropdown ? "active" : ""}`}
            onClick={() => setShowDropdown((prev) => !prev)}
            type="button"
            aria-label="Open entry menu"
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
