import React, { useState, useEffect, useRef } from "react";
import {
  FaCloudUploadAlt,
  FaFileExcel,
  FaFilePdf,
  FaTimes,
  FaCheck,
  FaSyncAlt,
  FaTrash,
  FaDownload,
  FaPlus,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  parsePortfolioFile,
  enrichPortfolioPrices,
  downloadSampleTemplate,
} from "../utils/portfolioParser.js";
import { addMultipleInvestmentEntries } from "../store/actions.js";
import { formatCurrency } from "../utils/currency.js";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";

export default function PortfolioImportModal({ isOpen, onClose, initialFile = null }) {
  const state = useReactor(store);
  const currentCurrency = state.ui.currency || "NGN";

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState("");
  const [parsedEntries, setParsedEntries] = useState([]);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  const [quoteProgress, setQuoteProgress] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  // When modal opens or initialFile changes, process it
  useEffect(() => {
    if (isOpen && initialFile) {
      handleFileSelected(initialFile);
    } else if (!isOpen) {
      resetState();
    }
  }, [isOpen, initialFile]);

  const resetState = () => {
    setFile(null);
    setIsDragging(false);
    setIsParsing(false);
    setParsingError("");
    setParsedEntries([]);
    setIsFetchingQuotes(false);
    setQuoteProgress("");
    setSuccessMessage("");
  };

  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setParsingError("");
    setSuccessMessage("");

    try {
      const results = await parsePortfolioFile(selectedFile);
      setParsedEntries(results);
    } catch (err) {
      setParsingError(err.message || "Failed to parse portfolio file.");
      setParsedEntries([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = parsedEntries.every((entry) => entry.selected);
    setParsedEntries((prev) =>
      prev.map((entry) => ({ ...entry, selected: !allSelected }))
    );
  };

  const toggleSelectEntry = (id) => {
    setParsedEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, selected: !entry.selected } : entry
      )
    );
  };

  const handleUpdateField = (id, field, value) => {
    setParsedEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;

        const updated = { ...entry, [field]: value };

        // Auto-recalculate amountSpent or prices if numeric fields change
        if (field === "amount" || field === "buyPrice") {
          const shares = field === "amount" ? parseFloat(value) || 0 : entry.amount;
          const buyPrice = field === "buyPrice" ? parseFloat(value) || 0 : entry.buyPrice;
          if (shares > 0 && buyPrice > 0) {
            updated.amountSpent = parseFloat((shares * buyPrice).toFixed(2));
          }
        } else if (field === "amountSpent") {
          const spent = parseFloat(value) || 0;
          if (spent > 0 && entry.amount > 0) {
            updated.buyPrice = parseFloat((spent / entry.amount).toFixed(4));
          }
        }

        return updated;
      })
    );
  };

  const handleDeleteRow = (id) => {
    setParsedEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAddRow = () => {
    const newRow = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "New Stock",
      symbol: "",
      market: "US",
      amount: 1,
      buyPrice: 0,
      currentPrice: 0,
      amountSpent: 0,
      baseCurrency: currentCurrency,
      selected: true,
      priceSource: "manual",
      priceUpdatedAt: new Date().toISOString(),
    };
    setParsedEntries((prev) => [...prev, newRow]);
  };

  const handleFetchLiveQuotes = async () => {
    if (parsedEntries.length === 0) return;
    setIsFetchingQuotes(true);
    setQuoteProgress("Starting market quotes lookup...");

    try {
      const enriched = await enrichPortfolioPrices(
        parsedEntries,
        (current, total, stockName) => {
          setQuoteProgress(`Fetching live price for ${stockName} (${current}/${total})...`);
        }
      );
      setParsedEntries(enriched);
      setQuoteProgress("Live market prices updated!");
    } catch (err) {
      setQuoteProgress(err.message || "Could not fetch all live prices.");
    } finally {
      setIsFetchingQuotes(false);
      setTimeout(() => setQuoteProgress(""), 4000);
    }
  };

  const handleImport = () => {
    const selectedEntries = parsedEntries.filter((entry) => entry.selected);
    if (selectedEntries.length === 0) {
      alert("Please select at least one stock to import.");
      return;
    }

    // Format clean entries for store
    const entriesToSave = selectedEntries.map((item) => ({
      name: item.name || item.symbol || "Stock",
      symbol: item.symbol || "",
      market: item.market || "US",
      amount: parseFloat(item.amount) || 1,
      currentPrice: parseFloat(item.currentPrice) || parseFloat(item.buyPrice) || 0,
      amountSpent: parseFloat(item.amountSpent) || (item.amount * item.buyPrice) || 0,
      baseCurrency: item.baseCurrency || (item.market === "NGX" ? "NGN" : "USD"),
      priceUpdatedAt: item.priceUpdatedAt || new Date().toISOString(),
      priceSource: item.priceSource || "import",
      priceError: item.priceError || "",
    }));

    addMultipleInvestmentEntries(entriesToSave);
    setSuccessMessage(`Successfully imported ${entriesToSave.length} investments!`);

    setTimeout(() => {
      onClose();
      resetState();
    }, 1200);
  };

  if (!isOpen) return null;

  const selectedCount = parsedEntries.filter((e) => e.selected).length;
  const totalCost = parsedEntries
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + (parseFloat(e.amountSpent) || 0), 0);
  const totalValue = parsedEntries
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + ((parseFloat(e.amount) || 0) * (parseFloat(e.currentPrice) || 0)), 0);

  return (
    <div className="portfolio-modal-overlay" onClick={onClose}>
      <div
        className="portfolio-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="portfolio-modal-header">
          <div className="portfolio-modal-title-wrap">
            <div className="portfolio-modal-icon">
              <FaCloudUploadAlt />
            </div>
            <div>
              <h3>Import Portfolio File</h3>
              <p>Upload your Excel (.xlsx, .xls), CSV, or PDF brokerage statement</p>
            </div>
          </div>

          <button
            className="portfolio-modal-close"
            onClick={onClose}
            type="button"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="portfolio-modal-body">
          {/* Dropzone Area */}
          {parsedEntries.length === 0 ? (
            <div
              className={`portfolio-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
              />

              <div className="dropzone-icon-group">
                <FaFileExcel className="excel-icon" />
                <FaCloudUploadAlt className="upload-main-icon" />
                <FaFilePdf className="pdf-icon" />
              </div>

              <h4>Drag & Drop your portfolio file here</h4>
              <p>Supports Excel (.xlsx, .xls), CSV (.csv), and PDF portfolio statements</p>

              <button
                type="button"
                className="btn btn-primary dropzone-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse File
              </button>

              <div className="template-download-section">
                <span>Need a template? </span>
                <button
                  type="button"
                  className="template-link-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleTemplate("xlsx");
                  }}
                >
                  <FaDownload /> Sample Excel (.xlsx)
                </button>
                <span className="template-sep">•</span>
                <button
                  type="button"
                  className="template-link-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleTemplate("csv");
                  }}
                >
                  <FaDownload /> Sample CSV (.csv)
                </button>
              </div>

              {isParsing && (
                <div className="parsing-loader">
                  <FaSyncAlt className="spinning" />
                  <span>Reading and analyzing your file...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="portfolio-preview-wrap">
              {/* File Info & Action Bar */}
              <div className="preview-top-bar">
                <div className="preview-file-badge">
                  {file?.name?.toLowerCase().endsWith(".pdf") ? (
                    <FaFilePdf className="pdf-color" />
                  ) : (
                    <FaFileExcel className="excel-color" />
                  )}
                  <span className="preview-file-name">{file?.name || "Uploaded Portfolio"}</span>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={() => {
                      setParsedEntries([]);
                      setFile(null);
                    }}
                  >
                    Change File
                  </button>
                </div>

                <div className="preview-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddRow}
                  >
                    <FaPlus /> Add Stock
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleFetchLiveQuotes}
                    disabled={isFetchingQuotes}
                  >
                    <FaSyncAlt className={isFetchingQuotes ? "spinning" : ""} />
                    {isFetchingQuotes ? "Fetching Quotes..." : "Fetch Live Prices"}
                  </button>
                </div>
              </div>

              {quoteProgress && (
                <div className="quote-progress-notice">
                  <FaSyncAlt className={isFetchingQuotes ? "spinning" : ""} />
                  <span>{quoteProgress}</span>
                </div>
              )}

              {/* Table of Parsed Stocks */}
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={
                            parsedEntries.length > 0 &&
                            parsedEntries.every((e) => e.selected)
                          }
                          onChange={toggleSelectAll}
                          aria-label="Select all stocks"
                        />
                      </th>
                      <th>Stock Name</th>
                      <th>Ticker</th>
                      <th>Market</th>
                      <th>Currency</th>
                      <th>Shares</th>
                      <th>Buy Price</th>
                      <th>Current Price</th>
                      <th>Amount Spent</th>
                      <th style={{ width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEntries.map((entry) => (
                      <tr key={entry.id} className={entry.selected ? "row-selected" : "row-unselected"}>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={entry.selected}
                            onChange={() => toggleSelectEntry(entry.id)}
                            aria-label={`Select ${entry.name}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-input"
                            value={entry.name}
                            onChange={(e) =>
                              handleUpdateField(entry.id, "name", e.target.value)
                            }
                            placeholder="Stock Name"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-input ticker-input"
                            value={entry.symbol}
                            onChange={(e) =>
                              handleUpdateField(
                                entry.id,
                                "symbol",
                                e.target.value.toUpperCase()
                              )
                            }
                            placeholder="e.g. AAPL"
                          />
                        </td>
                        <td>
                          <select
                            className="table-select"
                            value={entry.market}
                            onChange={(e) => {
                              handleUpdateField(entry.id, "market", e.target.value);
                              handleUpdateField(
                                entry.id,
                                "baseCurrency",
                                e.target.value === "NGX" ? "NGN" : "USD"
                              );
                            }}
                          >
                            <option value="US">US Stock</option>
                            <option value="NGX">NGX (Nigeria)</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="table-select"
                            value={entry.baseCurrency || (entry.market === "NGX" ? "NGN" : "USD")}
                            onChange={(e) =>
                              handleUpdateField(entry.id, "baseCurrency", e.target.value)
                            }
                          >
                            <option value="USD">USD ($)</option>
                            <option value="NGN">NGN (₦)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="table-input num-input"
                            value={entry.amount}
                            onChange={(e) =>
                              handleUpdateField(entry.id, "amount", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="table-input num-input"
                            value={entry.buyPrice}
                            onChange={(e) =>
                              handleUpdateField(entry.id, "buyPrice", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="table-input num-input"
                            value={entry.currentPrice}
                            onChange={(e) =>
                              handleUpdateField(entry.id, "currentPrice", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="table-input num-input"
                            value={entry.amountSpent}
                            onChange={(e) =>
                              handleUpdateField(entry.id, "amountSpent", e.target.value)
                            }
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="table-delete-btn"
                            onClick={() => handleDeleteRow(entry.id)}
                            title="Remove row"
                            aria-label="Remove stock"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="preview-summary-footer">
                <div className="summary-stat">
                  <span className="stat-label">Selected:</span>
                  <span className="stat-val">{selectedCount} of {parsedEntries.length} Stocks</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Cost Basis:</span>
                  <span className="stat-val">
                    {formatCurrency(totalCost, currentCurrency)}
                  </span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Est. Portfolio Value:</span>
                  <span className="stat-val text-green">
                    {formatCurrency(totalValue, currentCurrency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {parsingError && (
            <div className="import-error-banner">
              <FaExclamationCircle />
              <span>{parsingError}</span>
            </div>
          )}

          {successMessage && (
            <div className="import-success-banner">
              <FaCheck />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        <div className="portfolio-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          {parsedEntries.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={selectedCount === 0 || !!successMessage}
            >
              <FaCheck />
              Import {selectedCount} {selectedCount === 1 ? "Stock" : "Stocks"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
