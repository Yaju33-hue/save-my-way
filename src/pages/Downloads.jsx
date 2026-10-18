import React, { useState } from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import {
  selectWalletEntries,
  selectSavingsEntries,
  selectInvestmentsEntries,
  selectWalletTotal,
  selectSavingsTotal,
  selectInvestmentsTotal,
} from "../store/selectors.js";
import { FaFileDownload, FaFileCsv, FaFileCode, FaCheckCircle } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";

export default function Downloads() {
  const state = useReactor(store);
  const user = state.auth.user;
  const currency = state.ui.currency;

  const walletEntries = useSelector(store, selectWalletEntries);
  const savingsEntries = useSelector(store, selectSavingsEntries);
  const investmentsEntries = useSelector(store, selectInvestmentsEntries);

  const walletTotal = useSelector(store, selectWalletTotal);
  const savingsTotal = useSelector(store, selectSavingsTotal);
  const investmentsTotal = useSelector(store, selectInvestmentsTotal);

  const [downloadNotice, setDownloadNotice] = useState("");

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadNotice(`Downloaded ${filename}`);
    setTimeout(() => setDownloadNotice(""), 3500);
  };

  const getTimestamp = () => new Date().toISOString().split("T")[0];

  const exportWalletCsv = () => {
    const headers = ["ID", "Name", "Type", "Amount", "Recurring", "Frequency", "Created At"];
    const rows = walletEntries.map((e) => [
      `"${e.id || ""}"`,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      `"${e.type || ""}"`,
      e.amount || 0,
      e.recurring ? "Yes" : "No",
      `"${e.frequency || ""}"`,
      `"${e.createdAt || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `SaveMyWay_Wallet_${getTimestamp()}.csv`);
  };

  const exportSavingsCsv = () => {
    const headers = ["ID", "Name", "Target/Amount", "Interest Rate (%)", "Created At"];
    const rows = savingsEntries.map((e) => [
      `"${e.id || ""}"`,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      e.amount || 0,
      e.interestRate || 0,
      `"${e.createdAt || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `SaveMyWay_Savings_${getTimestamp()}.csv`);
  };

  const exportInvestmentsCsv = () => {
    const headers = ["ID", "Name", "Symbol", "Shares/Units", "Current Price", "Amount Spent", "Market", "Created At"];
    const rows = investmentsEntries.map((e) => [
      `"${e.id || ""}"`,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      `"${e.symbol || ""}"`,
      e.amount || 0,
      e.currentPrice || 0,
      e.amountSpent || 0,
      `"${e.market || ""}"`,
      `"${e.createdAt || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `SaveMyWay_Investments_${getTimestamp()}.csv`);
  };

  const exportCompleteJson = () => {
    const data = {
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
      },
      exportDate: new Date().toISOString(),
      currency,
      summary: {
        walletTotal,
        savingsTotal,
        investmentsTotal,
      },
      walletEntries,
      savingsEntries,
      investmentsEntries,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    triggerDownload(blob, `SaveMyWay_Financial_Export_${getTimestamp()}.json`);
  };

  return (
    <div className="downloads-page">
      <div className="card downloads-hero-card">
        <div className="downloads-header-wrap">
          <div className="downloads-hero-icon-wrap">
            <FiDownload className="downloads-hero-icon" />
          </div>
          <div>
            <h1 className="page-title">Downloads & Exports</h1>
            <p className="page-subtitle">
              Export your personal financial records, portfolio entries, and reports anytime.
            </p>
          </div>
        </div>

        {downloadNotice && (
          <div className="download-alert-success">
            <FaCheckCircle />
            <span>{downloadNotice}</span>
          </div>
        )}
      </div>

      <div className="downloads-grid">
        {/* Full Portfolio Export */}
        <div className="card download-card full-backup-card">
          <div className="download-card-header">
            <FaFileCode className="download-type-icon full-backup-icon" />
            <div>
              <h3 className="download-card-title">Complete Portfolio Backup</h3>
              <p className="download-card-desc">
                Includes all wallet transactions, savings goals, and investment assets in JSON format.
              </p>
            </div>
          </div>
          <div className="download-card-stats">
            <span>{walletEntries.length + savingsEntries.length + investmentsEntries.length} total records</span>
          </div>
          <button
            type="button"
            className="btn btn-primary download-action-btn"
            onClick={exportCompleteJson}
          >
            <FaFileDownload />
            Download Complete JSON
          </button>
        </div>

        {/* Wallet CSV Export */}
        <div className="card download-card">
          <div className="download-card-header">
            <FaFileCsv className="download-type-icon" />
            <div>
              <h3 className="download-card-title">Wallet Transactions</h3>
              <p className="download-card-desc">
                Income and expense history with recurrence schedules.
              </p>
            </div>
          </div>
          <div className="download-card-stats">
            <span>{walletEntries.length} entries</span>
            <CurrencyFormatter amount={walletTotal} />
          </div>
          <button
            type="button"
            className="btn btn-secondary download-action-btn"
            onClick={exportWalletCsv}
            disabled={walletEntries.length === 0}
          >
            <FaFileDownload />
            Download Wallet CSV
          </button>
        </div>

        {/* Savings CSV Export */}
        <div className="card download-card">
          <div className="download-card-header">
            <FaFileCsv className="download-type-icon" />
            <div>
              <h3 className="download-card-title">Savings Entries</h3>
              <p className="download-card-desc">
                Emergency funds, lock savings, and interest rate records.
              </p>
            </div>
          </div>
          <div className="download-card-stats">
            <span>{savingsEntries.length} entries</span>
            <CurrencyFormatter amount={savingsTotal} />
          </div>
          <button
            type="button"
            className="btn btn-secondary download-action-btn"
            onClick={exportSavingsCsv}
            disabled={savingsEntries.length === 0}
          >
            <FaFileDownload />
            Download Savings CSV
          </button>
        </div>

        {/* Investments CSV Export */}
        <div className="card download-card">
          <div className="download-card-header">
            <FaFileCsv className="download-type-icon" />
            <div>
              <h3 className="download-card-title">Investments & Stocks</h3>
              <p className="download-card-desc">
                Stock holdings, share amounts, and cost basis breakdown.
              </p>
            </div>
          </div>
          <div className="download-card-stats">
            <span>{investmentsEntries.length} entries</span>
            <CurrencyFormatter amount={investmentsTotal} />
          </div>
          <button
            type="button"
            className="btn btn-secondary download-action-btn"
            onClick={exportInvestmentsCsv}
            disabled={investmentsEntries.length === 0}
          >
            <FaFileDownload />
            Download Investments CSV
          </button>
        </div>
      </div>
    </div>
  );
}
