import { store } from "./index.js";
import { fanout } from "sia-reactor/utils";

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Actions for the centralized reactor store
// Migrated from AuthContext, ThemeContext, and DataContext

// Auth actions
export const signUp = (userData) => {
  store.auth.user = userData;
  store.auth.isAuthenticated = true;
};

export const signIn = (email, password) => {
  const currentUser = store.auth.user;
  if (currentUser && currentUser.email === email) {
    store.auth.isAuthenticated = true;
    return true;
  }
  return false;
};

export const signOut = () => {
  store.auth.user = null;
  store.auth.isAuthenticated = false;
};

// Theme actions
export const toggleTheme = () => {
  store.ui.theme = store.ui.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", store.ui.theme);
};

export const toggleHideBalance = () => {
  store.ui.hideBalance = !store.ui.hideBalance;
};

export const updateCurrency = (newCurrency) => {
  store.ui.currency = newCurrency;
};

// Financial actions
export const addWalletEntry = (entry) => {
  const newEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  fanout(store, "data.walletEntries", [...store.data.walletEntries, newEntry]);
};

export const updateWalletEntry = (id, updatedEntry) => {
  const index = store.data.walletEntries.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    const updated = { ...store.data.walletEntries[index], ...updatedEntry };
    fanout(store, "data.walletEntries", store.data.walletEntries.map((e, i) => (i === index ? updated : e)));
  }
};

export const deleteWalletEntry = (id) => {
  fanout(store, "data.walletEntries", store.data.walletEntries.filter((entry) => entry.id !== id));
};

export const addSavingsEntry = (entry) => {
  const newEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
    interestAccrued: 0,
  };
  fanout(store, "data.savingsEntries", [...store.data.savingsEntries, newEntry]);
};

export const updateSavingsEntry = (id, updatedEntry) => {
  const index = store.data.savingsEntries.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    const updated = { ...store.data.savingsEntries[index], ...updatedEntry };
    fanout(store, "data.savingsEntries", store.data.savingsEntries.map((e, i) => (i === index ? updated : e)));
  }
};

export const deleteSavingsEntry = (id) => {
  fanout(store, "data.savingsEntries", store.data.savingsEntries.filter((entry) => entry.id !== id));
};

export const addInvestmentEntry = (entry) => {
  const newEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  fanout(store, "data.investmentsEntries", [...store.data.investmentsEntries, newEntry]);
};

export const updateInvestmentEntry = (id, updatedEntry) => {
  const index = store.data.investmentsEntries.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    const updated = { ...store.data.investmentsEntries[index], ...updatedEntry };
    fanout(store, "data.investmentsEntries", store.data.investmentsEntries.map((e, i) => (i === index ? updated : e)));
  }
};

export const deleteInvestmentEntry = (id) => {
  fanout(store, "data.investmentsEntries", store.data.investmentsEntries.filter((entry) => entry.id !== id));
};

// Utility function for interest calculation (moved from DataContext)
export const calculateInterest = (entry) => {
  const daysDiff = Math.floor(
    (Date.now() - new Date(entry.createdAt)) / (1000 * 60 * 60 * 24)
  );
  const dailyInterest =
    (parseFloat(entry.amount) * (parseFloat(entry.interestRate) / 100)) / 365;
  return Math.max(0, dailyInterest * daysDiff);
};