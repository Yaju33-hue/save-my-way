import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import DropdownMenu from "./DropdownMenu.jsx";

export default function EntryCard({
  entry,
  onEdit,
  onDelete,
  type = "wallet",
}) {
  const { hideBalance, currency } = useTheme();
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
    if (entryType === "outgoing") return "#ff4757";
    return "var(--text-primary)";
  };

  const formattedAmount = hideBalance
    ? "****"
    : entry.amount.toLocaleString("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      });

  return (
    <div className="card fade-in-up">
      <div className="entry-card-content">
        <div className="entry-info">
          <h3 className="bold">{entry.name}</h3>

          <div className="entry-tags">
            <span
              className="entry-tag"
              style={{ color: getTypeColor(entry.type) }}
            >
              {entry.type?.toUpperCase()}
            </span>

            {entry.recurring && (
              <span className="recurring-tag">RECURRING</span>
            )}
          </div>
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
