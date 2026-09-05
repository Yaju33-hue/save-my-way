import { store } from "./index.js";
import { fanout } from "sia-reactor/utils";
import { fetchLiveExchangeRates } from "../utils/currency.js";


const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Actions for the centralized reactor store
// Migrated from AuthContext, ThemeContext, and DataContext

// User accounts persistence key
const USERS_STORAGE_KEY = "save_my_way_registered_users";

export const getRegisteredUsers = () => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(USERS_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRegisteredUsers = (users) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  } catch {
    // Ignore storage quota errors
  }
};

// Auth actions
export const signUp = (userData) => {
  const users = getRegisteredUsers();
  const normalizedEmail = String(userData.email || "").trim().toLowerCase();

  const newUserRecord = {
    id: userData.id || generateId(),
    name: String(userData.name || "").trim(),
    phone: String(userData.phone || "").trim(),
    email: normalizedEmail,
    password: String(userData.password || "").trim(),
    createdAt: userData.createdAt || new Date().toISOString(),
  };

  const existingIndex = users.findIndex(
    (u) => String(u.email || "").trim().toLowerCase() === normalizedEmail
  );

  if (existingIndex >= 0) {
    users[existingIndex] = newUserRecord;
  } else {
    users.push(newUserRecord);
  }

  saveRegisteredUsers(users);

  // Active session profile
  const profile = {
    id: newUserRecord.id,
    name: newUserRecord.name,
    phone: newUserRecord.phone,
    email: newUserRecord.email,
    createdAt: newUserRecord.createdAt,
  };

  store.auth.user = profile;
  store.auth.isAuthenticated = true;
  return profile;
};

export const signIn = (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "").trim();
  const users = getRegisteredUsers();

  let matchedUser = users.find(
    (u) => String(u.email || "").trim().toLowerCase() === normalizedEmail
  );

  // Check store.auth.user as fallback
  if (
    !matchedUser &&
    store.auth?.user &&
    String(store.auth.user.email || "").trim().toLowerCase() === normalizedEmail
  ) {
    matchedUser = store.auth.user;
  }

  if (matchedUser) {
    // Verify password if password is set on the account
    if (matchedUser.password && matchedUser.password !== rawPassword) {
      return false;
    }

    const profile = {
      id: matchedUser.id || generateId(),
      name: matchedUser.name || "User",
      phone: matchedUser.phone || "",
      email: matchedUser.email,
      createdAt: matchedUser.createdAt || new Date().toISOString(),
    };

    store.auth.user = profile;
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
  refreshRates();
};

export const refreshRates = async () => {
  await fetchLiveExchangeRates();
  store.ui.ratesUpdatedAt = Date.now();
};


// Financial actions
export const addWalletEntry = (entry) => {
  const newEntry = {
    ...entry,
    id: generateId(),
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
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
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
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
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
    createdAt: new Date().toISOString(),
  };
  fanout(store, "data.investmentsEntries", [...store.data.investmentsEntries, newEntry]);
};

export const addMultipleInvestmentEntries = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const newEntries = entries.map((entry) => ({
    ...entry,
    id: generateId(),
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
    createdAt: new Date().toISOString(),
  }));
  fanout(store, "data.investmentsEntries", [
    ...store.data.investmentsEntries,
    ...newEntries,
  ]);
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