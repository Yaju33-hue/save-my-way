import React, { createContext, useContext, useState, useEffect } from "react";
import { useTheme } from "./ThemeContext.jsx";

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export default function DataProvider({ children }) {
  const { currency } = useTheme();
  const [walletEntries, setWalletEntries] = useState([]);
  const [savingsEntries, setSavingsEntries] = useState([]);

  useEffect(() => {
    const savedWallet = localStorage.getItem("save-my-way-wallet");
    const savedSavings = localStorage.getItem("save-my-way-savings");

    if (savedWallet) setWalletEntries(JSON.parse(savedWallet));
    if (savedSavings) setSavingsEntries(JSON.parse(savedSavings));
  }, []);

  useEffect(() => {
    localStorage.setItem("save-my-way-wallet", JSON.stringify(walletEntries));
  }, [walletEntries]);

  useEffect(() => {
    localStorage.setItem("save-my-way-savings", JSON.stringify(savingsEntries));
  }, [savingsEntries]);

  // Calculate wallet total
  const walletTotal = walletEntries.reduce((total, entry) => {
    const amount = parseFloat(entry.amount) || 0;

    return entry.type === "incoming" ? total + amount : total - amount;
  }, 0);

  // Calculate savings total and interest
  const calculateInterest = (entry) => {
    const daysDiff = Math.floor(
      (Date.now() - new Date(entry.createdAt)) / (1000 * 60 * 60 * 24),
    );
    const dailyInterest =
      (parseFloat(entry.amount) * (parseFloat(entry.interestRate) / 100)) / 365;
    return Math.max(0, dailyInterest * daysDiff);
  };

  const savingsTotal = savingsEntries.reduce((total, entry) => {
    const amount = parseFloat(entry.amount) || 0;
    const interest = calculateInterest(entry);

    return total + amount + interest;
  }, 0);

  const totalInterest = savingsEntries.reduce(
    (total, entry) => total + calculateInterest(entry),
    0,
  );

  const addWalletEntry = (entry) => {
    setWalletEntries((prev) => [
      ...prev,
      {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const updateWalletEntry = (id, updatedEntry) => {
    setWalletEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...updatedEntry } : entry,
      ),
    );
  };

  const deleteWalletEntry = (id) => {
    setWalletEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const addSavingsEntry = (entry) => {
    setSavingsEntries((prev) => [
      ...prev,
      {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        interestAccrued: 0,
      },
    ]);
  };

  const updateSavingsEntry = (id, updatedEntry) => {
    setSavingsEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...updatedEntry } : entry,
      ),
    );
  };

  const deleteSavingsEntry = (id) => {
    setSavingsEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        walletEntries,
        savingsEntries,
        walletTotal,
        savingsTotal,
        totalInterest,
        currency,
        addWalletEntry,
        updateWalletEntry,
        deleteWalletEntry,
        addSavingsEntry,
        updateSavingsEntry,
        deleteSavingsEntry,
        calculateInterest,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
