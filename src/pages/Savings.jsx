import React from "react";
import { useData } from "../contexts/DataContext.jsx";
import EntryCard from "../components/EntryCard.jsx";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import { FaPlus, FaPiggyBank } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Savings() {
  const {
    savingsEntries,
    savingsTotal,
    totalInterest,
    deleteSavingsEntry,
    calculateInterest,
  } = useData();

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this savings entry?")) {
      deleteSavingsEntry(id);
    }
  };

  return (
    <div className="savings-page">
      <div className="savings-balance-card">
        <div className="savings-icon">
          <FaPiggyBank />
        </div>

        <p className="savings-label">Total Savings Balance</p>

        <CurrencyFormatter amount={savingsTotal} className="savings-amount" />

        <div className="interest-box">
          <span>Total Interest</span>
          <CurrencyFormatter
            amount={totalInterest}
            className="interest-amount"
          />
        </div>
      </div>

      <div className="savings-header">
        <h2>Savings Entries</h2>

        <Link to="/savings/add" className="small-add-btn">
          <FaPlus />
          Add
        </Link>
      </div>

      {savingsEntries.length === 0 ? (
        <div className="empty-state savings-empty">
          <div className="empty-icon">🐷</div>
          <h3>No savings entries yet</h3>
          <p>Start saving and watch your money grow.</p>

          <Link to="/savings/add" className="btn btn-primary">
            Add Savings
          </Link>
        </div>
      ) : (
        <div className="entries-list">
          {savingsEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={{
                ...entry,
                amount: parseFloat(entry.amount),
                interestAccrued: calculateInterest(entry),
              }}
              onDelete={handleDelete}
              type="savings"
            />
          ))}
        </div>
      )}

      <Link to="/savings/add" className="fab">
        <FaPlus />
      </Link>
    </div>
  );
}
