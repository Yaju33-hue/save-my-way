import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { addInvestmentEntry, updateInvestmentEntry } from "../store/actions.js";
import { getStockPrice, searchStockSuggestions } from "../utils/marketData.js";
import { FaArrowLeft, FaCloudUploadAlt } from "react-icons/fa";

const PortfolioImportModal = lazy(() => import("../components/PortfolioImportModal.jsx"));

export default function AddInvestmentEntry() {
  const state = useReactor(store);
  const investmentsEntries = state.data.investmentsEntries || [];
  const { id } = useParams();
  const navigate = useNavigate();

  const editingEntry = investmentsEntries.find((entry) => entry.id === id);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    currentPrice: "",
    amountSpent: "",
    symbol: "",
    market: "",
    priceUpdatedAt: "",
    priceSource: "",
  });
  const [priceLookupStatus, setPriceLookupStatus] = useState("");
  const [priceLookupError, setPriceLookupError] = useState("");
  const [matchedStock, setMatchedStock] = useState(null);
  const [stockSuggestions, setStockSuggestions] = useState([]);
  const [isStockSuggestionsOpen, setIsStockSuggestionsOpen] = useState(false);
  const [isSearchingStocks, setIsSearchingStocks] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const stockFieldRef = useRef(null);
  const selectedStockNameRef = useRef("");
  const stockLookupRequestRef = useRef(0);
  const stockSearchControllerRef = useRef(null);
  const stockQuoteControllerRef = useRef(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    document.title = id ? "SaveMyWay — Edit Investment" : "SaveMyWay — Add Investment";
  }, [id]);

  useEffect(() => {
    if (editingEntry) {
      selectedStockNameRef.current = editingEntry.name || "";
      setFormData({
        name: editingEntry.name,
        amount: String(editingEntry.amount),
        currentPrice: String(editingEntry.currentPrice),
        amountSpent: String(editingEntry.amountSpent),
        symbol: editingEntry.symbol || "",
        market: editingEntry.market || "",
        priceUpdatedAt: editingEntry.priceUpdatedAt || "",
        priceSource: editingEntry.priceSource || "",
      });
      if (editingEntry.symbol) {
        setMatchedStock({
          symbol: editingEntry.symbol,
          market: editingEntry.market,
          name: editingEntry.name,
        });
      }
    }
  }, [editingEntry]);

  useEffect(() => {
    const query = formData.name.trim();

    if (
      selectedStockNameRef.current &&
      query.toLowerCase() === selectedStockNameRef.current.toLowerCase()
    ) {
      setStockSuggestions([]);
      setIsStockSuggestionsOpen(false);
      return;
    }

    if (query.length < 2) {
      setStockSuggestions([]);
      setIsStockSuggestionsOpen(false);
      setPriceLookupStatus("");
      setPriceLookupError("");
      setIsSearchingStocks(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    stockSearchControllerRef.current = controller;
    const lookup = setTimeout(async () => {
      setIsSearchingStocks(true);
      setPriceLookupStatus("Searching stocks...");
      setPriceLookupError("");

      try {
        const results = await searchStockSuggestions(query, { signal: controller.signal });
        if (cancelled) return;

        setStockSuggestions(results);
        setIsStockSuggestionsOpen(results.length > 0);
        setPriceLookupStatus(
          results.length > 0
            ? ""
            : "No suggestions found. You can still enter a ticker manually.",
        );
      } catch (error) {
        if (cancelled) return;
        setStockSuggestions([]);
        setIsStockSuggestionsOpen(false);
        setPriceLookupStatus("");
        setPriceLookupError(error.message || "Could not search for stocks.");
      } finally {
        if (!cancelled) setIsSearchingStocks(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(lookup);
      controller.abort();
    };
  }, [formData.name]);

  useEffect(() => () => {
    stockLookupRequestRef.current += 1;
    stockSearchControllerRef.current?.abort();
    stockQuoteControllerRef.current?.abort();
  }, []);

  const handleStockNameChange = (name) => {
    stockLookupRequestRef.current += 1;
    stockSearchControllerRef.current?.abort();
    stockQuoteControllerRef.current?.abort();
    selectedStockNameRef.current = "";
    setMatchedStock(null);
    setStockSuggestions([]);
    setIsStockSuggestionsOpen(false);
    setIsSearchingStocks(false);
    setPriceLookupStatus("");
    setPriceLookupError("");
    setFormData((prev) => ({
      ...prev,
      name,
      symbol: "",
      market: "",
      currentPrice: "",
      priceUpdatedAt: "",
      priceSource: "",
    }));
  };

  const handleSelectStock = async (stock) => {
    stockSearchControllerRef.current?.abort();
    stockQuoteControllerRef.current?.abort();
    selectedStockNameRef.current = stock.name;
    setStockSuggestions([]);
    setIsStockSuggestionsOpen(false);
    setMatchedStock(stock);
    setPriceLookupError("");
    setPriceLookupStatus(`Fetching price for ${stock.displaySymbol || stock.symbol}...`);
    setFormData((prev) => ({
      ...prev,
      name: stock.name,
      symbol: stock.symbol,
      market: stock.market,
      currentPrice: "",
      priceUpdatedAt: "",
      priceSource: "",
    }));

    const requestId = ++stockLookupRequestRef.current;
    const controller = new AbortController();
    stockQuoteControllerRef.current = controller;
    try {
      const quote = await getStockPrice(stock.symbol, stock.market, {
        force: true,
        signal: controller.signal,
      });
      if (requestId !== stockLookupRequestRef.current) return;

      setFormData((prev) => ({
        ...prev,
        currentPrice: String(quote.price),
        priceUpdatedAt: quote.updatedAt,
        priceSource: quote.source,
      }));
      setPriceLookupStatus(`Price loaded for ${stock.displaySymbol || stock.symbol}`);
    } catch (error) {
      if (requestId !== stockLookupRequestRef.current) return;
      setPriceLookupStatus("");
      setPriceLookupError(error.message || "Could not fetch the latest price.");
    }
  };

  const sanitizeNumberInput = (value) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    return parts.length <= 1 ? sanitized : `${parts[0]}.${parts.slice(1).join("")}`;
  };

  const handleNumberKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, ., -
    if ([46, 8, 9, 27, 13, 110, 190, 173].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    // If it's not a number, prevent default
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    const entryData = {
      ...formData,
      amount: parseFloat(formData.amount),
      currentPrice: parseFloat(formData.currentPrice),
      amountSpent: parseFloat(formData.amountSpent),
    };

    id ? updateInvestmentEntry(id, entryData) : addInvestmentEntry(entryData);
    navigate("/investments");
  };

  if (id && !editingEntry) {
    return (
      <div className="container form-page">
        <div className="card form-card">
          <h2 className="form-title">Investment unavailable</h2>
          <p>This entry may have been deleted or is not available in this account.</p>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/investments")}>
            Back to Investments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container form-page">
      <div className="card form-card">
        <button
          className="back-btn"
          onClick={() => navigate("/investments")}
          type="button"
          aria-label="Go back to investments"
        >
          <FaArrowLeft />
          Back
        </button>

        <h2 className="form-title">
          {id ? "Edit Investment" : "Add Investment Entry"}
        </h2>

        <form onSubmit={handleSubmit} className="form">
          <div
            className="floating-field stock-name-field"
            ref={stockFieldRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsStockSuggestionsOpen(false);
              }
            }}
          >
            <input
              id="stock-name"
              type="text"
              className="input floating-input"
              value={formData.name}
              onChange={(e) => handleStockNameChange(e.target.value)}
              onFocus={() => {
                if (stockSuggestions.length > 0) setIsStockSuggestionsOpen(true);
              }}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isStockSuggestionsOpen}
              aria-controls="stock-suggestions"
              placeholder=" "
              required
            />
            <label htmlFor="stock-name">Name of Stock</label>
            {isStockSuggestionsOpen && stockSuggestions.length > 0 && (
              <ul id="stock-suggestions" className="stock-suggestions" role="listbox">
                {stockSuggestions.map((stock) => (
                  <li key={`${stock.market}:${stock.symbol}`} role="presentation">
                    <button
                      type="button"
                      className="stock-suggestion"
                      role="option"
                      aria-selected={matchedStock?.symbol === stock.symbol}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectStock(stock)}
                    >
                      <span className="stock-suggestion-name">
                        <strong>{stock.name}</strong>
                        <small>{stock.market}</small>
                      </span>
                      <span className="stock-suggestion-symbol">
                        {stock.displaySymbol || stock.symbol}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(priceLookupStatus || priceLookupError || matchedStock || isSearchingStocks) && (
            <div className={`price-lookup-note ${priceLookupError ? "error" : ""}`}>
              {isSearchingStocks ? "Searching stocks..." : priceLookupError ||
                `${priceLookupStatus}${
                  matchedStock?.market ? ` • ${matchedStock.market}` : ""
                }`}
            </div>
          )}

          <div className="floating-field">
            <input
              id="stock-amount"
              type="number"
              min="0"
              step="0.0000000001"
              inputMode="decimal"
              className="input floating-input"
              value={formData.amount}
              onChange={(e) => handleChange("amount", sanitizeNumberInput(e.target.value))}
              onKeyDown={handleNumberKeyDown}
              placeholder=" "
              required
            />
            <label htmlFor="stock-amount">Amount of Stock Bought</label>
          </div>

          <div className="floating-field">
            <input
              id="stock-current-price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="input floating-input"
              value={formData.currentPrice}
              onChange={(e) => handleChange("currentPrice", sanitizeNumberInput(e.target.value))}
              onKeyDown={handleNumberKeyDown}
              placeholder=" "
              required
            />
            <label htmlFor="stock-current-price">Current Price per Share</label>
          </div>

          <div className="floating-field">
            <input
              id="stock-amount-spent"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="input floating-input"
              value={formData.amountSpent}
              onChange={(e) => handleChange("amountSpent", sanitizeNumberInput(e.target.value))}
              onKeyDown={handleNumberKeyDown}
              placeholder=" "
              required
            />
            <label htmlFor="stock-amount-spent">Amount Spent to Acquire Stock</label>
          </div>

          <button type="submit" className="btn btn-primary form-btn">
            {id ? "Update Investment" : "Add Investment"}
          </button>

          {!id && (
            <button
              type="button"
              className="btn btn-secondary form-btn"
              style={{ marginTop: "0.75rem" }}
              onClick={() => setIsImportModalOpen(true)}
            >
              <FaCloudUploadAlt /> Import from File (.xlsx, .csv, .pdf)
            </button>
          )}
        </form>
      </div>

      {isImportModalOpen && (
        <Suspense
          fallback={
            <div className="portfolio-modal-loading" role="status">
              Loading portfolio tools...
            </div>
          }
        >
          <PortfolioImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
