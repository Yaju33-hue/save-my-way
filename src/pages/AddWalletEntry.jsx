import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { addWalletEntry, updateWalletEntry } from "../store/actions.js";
import { FaArrowLeft } from "react-icons/fa";

export default function AddWalletEntry() {
  const state = useReactor(store);
  const walletEntries = state.data.walletEntries;
  const { id } = useParams();
  const navigate = useNavigate();

  const editingEntry = walletEntries.find((entry) => entry.id === id);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    type: "incoming",
    recurring: false,
    frequency: "daily",
    dayOfMonth: 1,
    month: 1,
    dayOfYear: 1,
  });

  const [typeOpen, setTypeOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [dayOfMonthOpen, setDayOfMonthOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);

  const typeRef = useRef(null);
  const frequencyRef = useRef(null);
  const dayOfMonthRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);

  const typeOptions = [
    { value: "incoming", label: "Incoming" },
    { value: "outgoing", label: "Outgoing" },
  ];

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  const dayOptions = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }));

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));

  const selectedType = typeOptions.find(
    (option) => option.value === formData.type,
  );

  const selectedFrequency = frequencyOptions.find(
    (option) => option.value === formData.frequency,
  );

  const selectedMonth = monthOptions.find(
    (option) => option.value === formData.month,
  );

  const closeAllDropdowns = () => {
    setTypeOpen(false);
    setFrequencyOpen(false);
    setDayOfMonthOpen(false);
    setMonthOpen(false);
    setDayOpen(false);
  };

  useEffect(() => {
    if (editingEntry) setFormData(editingEntry);
  }, [editingEntry]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideAnyDropdown =
        typeRef.current?.contains(e.target) ||
        frequencyRef.current?.contains(e.target) ||
        dayOfMonthRef.current?.contains(e.target) ||
        monthRef.current?.contains(e.target) ||
        dayRef.current?.contains(e.target);

      if (!clickedInsideAnyDropdown) closeAllDropdowns();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sanitizeNumberInput = (value) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    return parts.length <= 1 ? sanitized : `${parts[0]}.${parts.slice(1).join("")}`;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const entryData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    id ? updateWalletEntry(id, entryData) : addWalletEntry(entryData);
    navigate("/wallet");
  };

  return (
    <div className="container form-page">
      <div className="card form-card">
        <button className="back-btn" onClick={() => navigate("/wallet")}>
          <FaArrowLeft />
          Back
        </button>

        <h2 className="form-title">{id ? "Edit Entry" : "Add Wallet Entry"}</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="floating-field">
            <input
              type="text"
              className="input floating-input"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onFocus={closeAllDropdowns}
              placeholder=" "
              required
            />
            <label>Entry Name</label>
          </div>

          <div className="floating-field">
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="input floating-input"
              value={formData.amount}
              onChange={(e) => handleChange("amount", sanitizeNumberInput(e.target.value))}
              onFocus={closeAllDropdowns}
              placeholder=" "
              required
            />
            <label>Amount</label>
          </div>

          <div className="floating-field" ref={typeRef}>
            <div className="custom-dropdown">
              <button
                type="button"
                className={`custom-dropdown-btn ${typeOpen ? "open" : ""}`}
                onClick={() => {
                  if (typeOpen) {
                    setTypeOpen(false);
                  } else {
                    closeAllDropdowns();
                    setTypeOpen(true);
                  }
                }}
              >
                <span>{selectedType?.label || "Type"}</span>
                <span className="dropdown-arrow">⌄</span>
              </button>

              {typeOpen && (
                <div className="custom-dropdown-menu">
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`custom-dropdown-option ${
                        formData.type === option.value ? "selected" : ""
                      }`}
                      onClick={() => {
                        handleChange("type", option.value);
                        setTypeOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="toggle-row">
            <span>Recurring</span>

            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) => {
                  closeAllDropdowns();
                  handleChange("recurring", e.target.checked);
                }}
              />
              <span className="checkmark"></span>
            </label>
          </div>

          {formData.recurring && (
            <>
              <div className="floating-field" ref={frequencyRef}>
                <div className="custom-dropdown">
                  <button
                    type="button"
                    className={`custom-dropdown-btn ${
                      frequencyOpen ? "open" : ""
                    }`}
                    onClick={() => {
                      if (frequencyOpen) {
                        setFrequencyOpen(false);
                      } else {
                        closeAllDropdowns();
                        setFrequencyOpen(true);
                      }
                    }}
                  >
                    <span>{selectedFrequency?.label || "Frequency"}</span>
                    <span className="dropdown-arrow">⌄</span>
                  </button>

                  {frequencyOpen && (
                    <div className="custom-dropdown-menu">
                      {frequencyOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`custom-dropdown-option ${
                            formData.frequency === option.value
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => {
                            handleChange("frequency", option.value);
                            setFrequencyOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {formData.frequency === "monthly" && (
                <div className="floating-field" ref={dayOfMonthRef}>
                  <div className="custom-dropdown">
                    <button
                      type="button"
                      className={`custom-dropdown-btn ${
                        dayOfMonthOpen ? "open" : ""
                      }`}
                      onClick={() => {
                        if (dayOfMonthOpen) {
                          setDayOfMonthOpen(false);
                        } else {
                          closeAllDropdowns();
                          setDayOfMonthOpen(true);
                        }
                      }}
                    >
                      <span>Day {formData.dayOfMonth}</span>
                      <span className="dropdown-arrow">⌄</span>
                    </button>

                    {dayOfMonthOpen && (
                      <div className="custom-dropdown-menu dropdown-scroll">
                        {dayOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`custom-dropdown-option ${
                              formData.dayOfMonth === option.value
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              handleChange("dayOfMonth", option.value);
                              setDayOfMonthOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.frequency === "yearly" && (
                <div className="grid-2">
                  <div className="floating-field" ref={monthRef}>
                    <div className="custom-dropdown">
                      <button
                        type="button"
                        className={`custom-dropdown-btn ${
                          monthOpen ? "open" : ""
                        }`}
                        onClick={() => {
                          if (monthOpen) {
                            setMonthOpen(false);
                          } else {
                            closeAllDropdowns();
                            setMonthOpen(true);
                          }
                        }}
                      >
                        <span>{selectedMonth?.label || "Month"}</span>
                        <span className="dropdown-arrow">⌄</span>
                      </button>

                      {monthOpen && (
                        <div className="custom-dropdown-menu dropdown-scroll">
                          {monthOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`custom-dropdown-option ${
                                formData.month === option.value
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => {
                                handleChange("month", option.value);
                                setMonthOpen(false);
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="floating-field" ref={dayRef}>
                    <div className="custom-dropdown">
                      <button
                        type="button"
                        className={`custom-dropdown-btn ${
                          dayOpen ? "open" : ""
                        }`}
                        onClick={() => {
                          if (dayOpen) {
                            setDayOpen(false);
                          } else {
                            closeAllDropdowns();
                            setDayOpen(true);
                          }
                        }}
                      >
                        <span>Day {formData.dayOfYear}</span>
                        <span className="dropdown-arrow">⌄</span>
                      </button>

                      {dayOpen && (
                        <div className="custom-dropdown-menu dropdown-scroll">
                          {dayOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`custom-dropdown-option ${
                                formData.dayOfYear === option.value
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => {
                                handleChange("dayOfYear", option.value);
                                setDayOpen(false);
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn btn-primary form-btn">
            {id ? "Update Entry" : "Add Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
