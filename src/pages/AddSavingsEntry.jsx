import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext.jsx";
import { FaArrowLeft } from "react-icons/fa";

export default function AddSavingsEntry() {
  const { savingsEntries, addSavingsEntry, updateSavingsEntry } = useData();
  const { id } = useParams();
  const navigate = useNavigate();

  const editingEntry = savingsEntries.find((entry) => entry.id === id);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    interestRate: "",
  });

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        name: editingEntry.name,
        amount: editingEntry.amount,
        interestRate: editingEntry.interestRate,
      });
    }
  }, [editingEntry]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const entryData = {
      ...formData,
      amount: parseFloat(formData.amount),
      interestRate: parseFloat(formData.interestRate),
    };

    id ? updateSavingsEntry(id, entryData) : addSavingsEntry(entryData);
    navigate("/savings");
  };

  return (
    <div className="container form-page">
      <div className="card form-card">
        <button className="back-btn" onClick={() => navigate("/savings")}>
          <FaArrowLeft />
          Back
        </button>

        <h2 className="form-title">
          {id ? "Edit Savings" : "Add Savings Entry"}
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
            <label>Savings Name</label>
          </div>

          <div className="floating-field">
            <input
              type="text"
              inputMode="decimal"
              className="input floating-input"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder=" "
              required
            />
            <label>Amount</label>
          </div>

          <div className="floating-field">
            <input
              type="text"
              inputMode="decimal"
              className="input floating-input"
              value={formData.interestRate}
              onChange={(e) => handleChange("interestRate", e.target.value)}
              placeholder=" "
              required
            />
            <label>Annual Interest Rate (%)</label>
          </div>

          <button type="submit" className="btn btn-primary form-btn">
            {id ? "Update Savings" : "Add Savings"}
          </button>
        </form>
      </div>
    </div>
  );
}
