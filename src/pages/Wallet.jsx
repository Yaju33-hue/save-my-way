import React from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { deleteWalletEntry, toggleHideBalance } from "../store/actions.js";
import { selectWalletTotal } from "../store/selectors.js";
import EntryCard from "../components/EntryCard.jsx";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import { FaPlus, FaWallet, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

export default function Wallet() {
  const state = useReactor(store);
  const walletEntries = state.data.walletEntries;
  const walletTotal = useSelector(store, selectWalletTotal);
  const hideBalance = state.ui.hideBalance;
  const navigate = useNavigate();

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

        <div className="balance-row">
          <CurrencyFormatter
            amount={hideBalance ? 0 : walletTotal}
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
