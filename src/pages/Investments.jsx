import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import {
  deleteInvestmentEntry,
  toggleHideBalance,
  updateInvestmentEntry,
} from "../store/actions.js";
import {
  selectInvestmentsTotal,
  selectInvestmentsTotalCost,
  selectInvestmentProfitLoss,
} from "../store/selectors.js";
import { confirmDeleteAction } from "../utils/confirmDialog.js";
import { getStockPrice } from "../utils/marketData.js";
import InvestmentCard from "../components/InvestmentCard.jsx";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import PortfolioImportModal from "../components/PortfolioImportModal.jsx";
import {
  FaPlus,
  FaUniversity,
  FaEye,
  FaEyeSlash,
  FaCloudUploadAlt,
  FaFileExcel,
  FaSyncAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

export default function Investments() {
  const state = useReactor(store);
  const investmentEntries = useMemo(
    () => state.data.investmentsEntries || [],
    [state.data.investmentsEntries]
  );
  const investmentsTotal = useSelector(store, selectInvestmentsTotal);
  const investmentsTotalCost = useSelector(store, selectInvestmentsTotalCost);
  const totalProfitLoss = useSelector(store, selectInvestmentProfitLoss);
  const hideBalance = state.ui.hideBalance;
  const navigate = useNavigate();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

  const trackedInvestmentsKey = investmentEntries
    .map((entry) => `${entry.id}:${entry.symbol || ""}:${entry.market || ""}`)
    .join("|");
  const investmentEntriesRef = useRef(investmentEntries);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    investmentEntriesRef.current = investmentEntries;
  }, [investmentEntries]);

  useEffect(() => {
    document.title = "SaveMyWay — Investments";
  }, []);

  // Global drag-and-drop listener over the page
  const handlePageDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOverPage(true);
    }
  };

  const handlePageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOverPage(false);
    }
  };

  const handlePageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOverPage(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (
        name.endsWith(".xlsx") ||
        name.endsWith(".xls") ||
        name.endsWith(".csv") ||
        name.endsWith(".pdf")
      ) {
        setDroppedFile(file);
        setIsImportModalOpen(true);
      }
    }
  };

  const refreshPrices = async (force = false) => {
    const trackedEntries = investmentEntriesRef.current.filter(
      (entry) => entry.symbol && entry.market,
    );
    if (trackedEntries.length === 0) return;

    setIsRefreshingPrices(true);

    for (const entry of trackedEntries) {
      // If entry came from an imported file and this is just an auto/mount refresh,
      // preserve the user's exact spreadsheet prices unless they clicked "Refresh" explicitly
      if (!force && (entry.priceSource === "file" || entry.priceSource === "import")) {
        continue;
      }

      try {
        const quote = await getStockPrice(entry.symbol, entry.market, { force });

        // Never overwrite a valid existing price with a static reference index fallback
        if (
          quote.source === "reference-index" &&
          entry.currentPrice &&
          Number(entry.currentPrice) > 0
        ) {
          continue;
        }

        updateInvestmentEntry(entry.id, {
          currentPrice: quote.price,
          priceUpdatedAt: quote.updatedAt,
          priceSource: quote.source,
          priceError: quote.error || "",
        });
      } catch (error) {
        updateInvestmentEntry(entry.id, {
          priceError: error.message || "Price refresh failed",
        });
      }
    }

    setIsRefreshingPrices(false);
  };

  useEffect(() => {
    refreshPrices();

    // 60-second auto-refresh interval
    const interval = window.setInterval(() => {
      refreshPrices();
    }, 60 * 1000);

    const handleFocus = () => refreshPrices(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [trackedInvestmentsKey]);

  const handleDelete = (id) => {
    confirmDeleteAction(() => deleteInvestmentEntry(id));
  };

  const isProfit = totalProfitLoss >= 0;

  return (
    <div
      className="investments-page"
      onDragEnter={handlePageDragEnter}
      onDragLeave={handlePageDragLeave}
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
    >
      {/* Visual full-page drag overlay */}
      {isDraggingOverPage && (
        <div className="page-drag-overlay">
          <div className="page-drag-box">
            <FaCloudUploadAlt className="page-drag-icon" />
            <h3>Drop Portfolio File to Auto-Import</h3>
            <p>Supports Excel (.xlsx, .xls), CSV (.csv), and PDF portfolio statements</p>
          </div>
        </div>
      )}

      <div className="investments-balance-card">
        <div className="wallet-icon">
          <FaUniversity />
        </div>

        <p className="wallet-label">Total Investment Value</p>

        <div className="balance-row">
          <CurrencyFormatter
            amount={hideBalance ? 0 : investmentsTotal}
            className="wallet-amount"
          />

          <button
            className="balance-toggle-btn"
            onClick={toggleHideBalance}
            type="button"
            aria-label={hideBalance ? "Show balance" : "Hide balance"}
          >
            {hideBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <div className="investment-metrics-row">
          <div className="interest-box">
            <span>Total Invested</span>
            <CurrencyFormatter
              amount={hideBalance ? 0 : investmentsTotalCost}
              className="interest-amount"
            />
          </div>

          <div className="interest-box">
            <span>{isProfit ? "Total Profit" : "Total Loss"}</span>
            <CurrencyFormatter
              amount={hideBalance ? 0 : totalProfitLoss}
              className={`interest-amount ${isProfit ? "profit-text" : "loss-text"}`}
            />
          </div>
        </div>
      </div>

      <div className="wallet-header">
        <div>
          <h2>Investments</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {isRefreshingPrices ? "Updating prices..." : `Auto-refresh active (60s)`}
          </span>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="small-import-btn"
            onClick={() => refreshPrices(true)}
            disabled={isRefreshingPrices}
            title="Auto-refreshes every 60s. Click to refresh live quotes now."
          >
            <FaSyncAlt className={isRefreshingPrices ? "spinning" : ""} />
            {isRefreshingPrices ? "Updating..." : "Refresh"}
          </button>

          <button
            type="button"
            className="small-import-btn"
            onClick={() => {
              setDroppedFile(null);
              setIsImportModalOpen(true);
            }}
            title="Import portfolio from Excel, CSV, or PDF"
          >
            <FaCloudUploadAlt />
            Import File
          </button>

          <Link to="/investments/add" className="small-add-btn">
            <FaPlus />
            Add
          </Link>
        </div>
      </div>

      {investmentEntries.length === 0 ? (
        <div className="empty-state wallet-empty">
          <div className="empty-icon">🏦</div>
          <h3>No investments yet</h3>
          <p>Add your first stock purchase or drop an Excel spreadsheet/PDF portfolio to import.</p>

          <div className="empty-action-buttons">
            <Link to="/investments/add" className="btn btn-primary">
              <FaPlus /> Add Investment
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setDroppedFile(null);
                setIsImportModalOpen(true);
              }}
            >
              <FaFileExcel /> Import Portfolio File
            </button>
          </div>
        </div>
      ) : (
        <div className="entries-list">
          {investmentEntries.map((entry) => (
            <InvestmentCard
              key={entry.id}
              entry={entry}
              onEdit={() => navigate(`/investments/edit/${entry.id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Link to="/investments/add" className="fab" aria-label="Add investment">
        <FaPlus />
      </Link>

      {/* Import Modal */}
      <PortfolioImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setDroppedFile(null);
        }}
        initialFile={droppedFile}
      />
    </div>
  );
}
