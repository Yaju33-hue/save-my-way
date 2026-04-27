import React from "react";
import { useData } from "../contexts/DataContext.jsx";
import EntryCard from "../components/EntryCard.jsx";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import { FaPlus, FaWallet } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Wallet() {
  const { walletEntries, walletTotal, deleteWalletEntry } = useData();

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      deleteWalletEntry(id);
    }
  };

  return (
    <div className="wallet-page">
      <div className="wallet-balance-card">
        <div className="wallet-icon">
          <FaWallet />
        </div>

        <p className="wallet-label">Total Wallet Balance</p>

        <CurrencyFormatter amount={walletTotal} className="wallet-amount" />
      </div>

      <div className="wallet-header">
        <h2>Wallet Entries</h2>

        <Link to="/wallet/add" className="small-add-btn">
          <FaPlus />
          Add
        </Link>
      </div>

      {walletEntries.length === 0 ? (
        <div className="empty-state wallet-empty">
          <div className="empty-icon">👛</div>
          <h3>No wallet entries yet</h3>
          <p>Add your first income or expense to start tracking your money.</p>

          <Link to="/wallet/add" className="btn btn-primary">
            Add Entry
          </Link>
        </div>
      ) : (
        <div className="entries-list">
          {walletEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => navigate(`/wallet/edit/${entry.id}`)}
              onDelete={handleDelete}
              type="wallet"
            />
          ))}
        </div>
      )}

      <Link to="/wallet/add" className="fab">
        <FaPlus />
      </Link>
    </div>
  );
}
