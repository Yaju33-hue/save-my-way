import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import {
  selectWalletEntries,
  selectSavingsEntries,
  selectInvestmentsEntries,
} from "../store/selectors.js";
import { FiSearch, FiX } from "react-icons/fi";
import { FaWallet, FaPiggyBank, FaUniversity, FaChevronRight } from "react-icons/fa";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const walletEntries = useSelector(store, selectWalletEntries);
  const savingsEntries = useSelector(store, selectSavingsEntries);
  const investmentsEntries = useSelector(store, selectInvestmentsEntries);

  const allItems = useMemo(() => {
    const list = [];

    walletEntries.forEach((entry) => {
      list.push({
        id: entry.id,
        category: "wallet",
        categoryLabel: "Wallet",
        title: entry.name || "Untitled Wallet Entry",
        subtitle: `${entry.type === "incoming" ? "Income" : "Expense"} • ${
          entry.recurring ? `${entry.frequency} recurring` : "One-time"
        }`,
        amount: entry.amount || 0,
        type: entry.type,
        link: `/wallet/edit/${entry.id}`,
        icon: FaWallet,
        colorClass: entry.type === "incoming" ? "color-incoming" : "color-outgoing",
      });
    });

    savingsEntries.forEach((entry) => {
      list.push({
        id: entry.id,
        category: "savings",
        categoryLabel: "Savings",
        title: entry.name || "Untitled Savings",
        subtitle: `${entry.interestRate || 0}% annual return`,
        amount: entry.amount || 0,
        type: "savings",
        link: `/savings/edit/${entry.id}`,
        icon: FaPiggyBank,
        colorClass: "color-savings",
      });
    });

    investmentsEntries.forEach((entry) => {
      const shares = entry.amount || 0;
      const price = entry.currentPrice || 0;
      const value = shares * price;
      list.push({
        id: entry.id,
        category: "investments",
        categoryLabel: "Investments",
        title: entry.name || "Untitled Asset",
        subtitle: `${entry.symbol || ""} ${entry.market ? `(${entry.market})` : ""} • ${shares} shares @ ₦${price}`,
        amount: value,
        type: "investment",
        link: `/investments/edit/${entry.id}`,
        icon: FaUniversity,
        colorClass: "color-investment",
      });
    });

    return list;
  }, [walletEntries, savingsEntries, investmentsEntries]);

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return allItems.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      if (!cleanQuery) return true;
      return (
        item.title.toLowerCase().includes(cleanQuery) ||
        item.subtitle.toLowerCase().includes(cleanQuery) ||
        item.categoryLabel.toLowerCase().includes(cleanQuery)
      );
    });
  }, [allItems, query, activeCategory]);

  return (
    <div className="search-page">
      <div className="card search-header-card">
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Find transactions, savings targets, and investment holdings.</p>

        <div className="search-bar-wrap">
          <FiSearch className="search-bar-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, symbol, category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="search-filter-pills">
          <button
            type="button"
            className={`search-filter-pill ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All ({allItems.length})
          </button>
          <button
            type="button"
            className={`search-filter-pill ${activeCategory === "wallet" ? "active" : ""}`}
            onClick={() => setActiveCategory("wallet")}
          >
            Wallet ({walletEntries.length})
          </button>
          <button
            type="button"
            className={`search-filter-pill ${activeCategory === "savings" ? "active" : ""}`}
            onClick={() => setActiveCategory("savings")}
          >
            Savings ({savingsEntries.length})
          </button>
          <button
            type="button"
            className={`search-filter-pill ${activeCategory === "investments" ? "active" : ""}`}
            onClick={() => setActiveCategory("investments")}
          >
            Investments ({investmentsEntries.length})
          </button>
        </div>
      </div>

      <div className="search-results-list">
        {filteredItems.length === 0 ? (
          <div className="card empty-state">
            <FiSearch className="empty-icon" />
            <h3>No entries found</h3>
            <p>
              {query
                ? `No results matching "${query}". Try another search term.`
                : "No entries in this category yet."}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={`${item.category}-${item.id}`}
                to={item.link}
                className="card search-result-item"
              >
                <div className={`search-result-icon-wrap ${item.colorClass}`}>
                  <Icon />
                </div>
                <div className="search-result-details">
                  <div className="search-result-title-row">
                    <span className="search-result-title">{item.title}</span>
                    <span className="search-result-badge">{item.categoryLabel}</span>
                  </div>
                  <span className="search-result-subtitle">{item.subtitle}</span>
                </div>
                <div className="search-result-amount-wrap">
                  <CurrencyFormatter amount={item.amount} />
                  <FaChevronRight className="search-chevron" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
