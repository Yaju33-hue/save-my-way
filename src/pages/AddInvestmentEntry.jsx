import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { addInvestmentEntry, updateInvestmentEntry } from "../store/actions.js";
import { getStockPrice, searchStock } from "../utils/marketData.js";
import PortfolioImportModal from "../components/PortfolioImportModal.jsx";
import { FaArrowLeft, FaCloudUploadAlt } from "react-icons/fa";

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    document.title = id ? "SaveMyWay — Edit Investment" : "SaveMyWay — Add Investment";
  }, [id]);

  useEffect(() => {
    if (editingEntry) {
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

    if (query.length < 2) {
      setMatchedStock(null);
      setPriceLookupStatus("");
      setPriceLookupError("");
      return;
    }

    let cancelled = false;
    const lookup = setTimeout(async () => {
      setPriceLookupStatus("Looking up stock...");
      setPriceLookupError("");

      try {
        const result = await searchStock(query);
        if (cancelled) return;

        if (!result) {
          setMatchedStock(null);
          setPriceLookupStatus("");
          setPriceLookupError("No stock match found yet.");
          return;
        }

        setMatchedStock(result);
        setPriceLookupStatus(`Matched ${result.displaySymbol || result.symbol}`);

        const quote = await getStockPrice(result.symbol, result.market, { force: true });
        if (cancelled) return;

        setFormData((prev) => ({
          ...prev,
          symbol: result.symbol,
          market: result.market,
          currentPrice: String(quote.price),
          priceUpdatedAt: quote.updatedAt,
          priceSource: quote.source,
        }));
        setPriceLookupStatus(`Price loaded for ${result.displaySymbol || result.symbol}`);
      } catch (error) {
        if (cancelled) return;
        setPriceLookupStatus("");
        setPriceLookupError(error.message || "Could not auto-fill the latest price.");
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(lookup);
    };
  }, [formData.name]);

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

    const entryData = {
      ...formData,
      amount: parseFloat(formData.amount),
      currentPrice: parseFloat(formData.currentPrice),
      amountSpent: parseFloat(formData.amountSpent),
    };

    id ? updateInvestmentEntry(id, entryData) : addInvestmentEntry(entryData);
    navigate("/investments");
  };

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
          <div className="floating-field">
            <input
              type="text"
              className="input floating-input"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder=" "
              required
            />
            <label>Name of Stock</label>
          </div>

          {(priceLookupStatus || priceLookupError || matchedStock) && (
            <div className={`price-lookup-note ${priceLookupError ? "error" : ""}`}>
              {priceLookupError ||
                `${priceLookupStatus}${
                  matchedStock?.market ? ` • ${matchedStock.market}` : ""
                }`}
            </div>
          )}

          <div className="floating-field">
            <input
              type="number"
              min="0"
              step="0.0001"
              inputMode="decimal"
              className="input floating-input"
              value={formData.amount}
              onChange={(e) => handleChange("amount", sanitizeNumberInput(e.target.value))}
              onKeyDown={handleNumberKeyDown}
              placeholder=" "
              required
            />
            <label>Amount of Stock Bought</label>
          </div>

          <div className="floating-field">
            <input
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
            <label>Current Price per Share</label>
          </div>

          <div className="floating-field">
            <input
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
            <label>Amount Spent to Acquire Stock</label>
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

      <PortfolioImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
