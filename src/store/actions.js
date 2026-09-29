import { store } from "./index.js";
import { fanout } from "sia-reactor/utils";
import { fetchLiveExchangeRates } from "../utils/currency.js";

const STORAGE_KEYS = {
  users: "save_my_way_registered_users",
  sessions: "save_my_way_sessions",
  userData: "save_my_way_user_data",
  activeSession: "save_my_way_active_session",
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const generateId = () => {
  if (typeof crypto === "undefined") {
    throw new Error("Secure ID generation is unavailable in this browser.");
  }
  if (crypto.randomUUID) return crypto.randomUUID();
  if (crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }
  throw new Error("Secure ID generation is unavailable in this browser.");
};

const getStorage = () =>
  typeof localStorage !== "undefined" ? localStorage : null;

const readJson = (key, fallback) => {
  try {
    const value = getStorage()?.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    getStorage()?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const serializePassword = async (value) => {
  const raw = String(value ?? "");

  if (typeof crypto === "undefined" || !crypto.subtle?.digest) {
    throw new Error(
      "Secure password handling is unavailable. Use a modern browser over HTTPS and try again.",
    );
  }

  const bytes = new TextEncoder().encode(raw);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const getRegisteredUsers = () => readJson(STORAGE_KEYS.users, []);
const saveRegisteredUsers = (users) => writeJson(STORAGE_KEYS.users, users);
const getSessions = () => readJson(STORAGE_KEYS.sessions, []);
const saveSessions = (sessions) => writeJson(STORAGE_KEYS.sessions, sessions);
const getUserDataStore = () => readJson(STORAGE_KEYS.userData, {});
const saveUserDataStore = (data) => writeJson(STORAGE_KEYS.userData, data);

const getActiveSessionToken = () => getStorage()?.getItem(STORAGE_KEYS.activeSession) || null;
const setActiveSessionToken = (token) => {
  const storage = getStorage();
  if (!storage) return;
  if (token) storage.setItem(STORAGE_KEYS.activeSession, token);
  else storage.removeItem(STORAGE_KEYS.activeSession);
};

const createSessionRecord = (userId) => {
  const now = Date.now();
  const session = {
    id: generateId(),
    token: generateId(),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };

  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
  setActiveSessionToken(session.token);
  return session;
};

const clearInvalidSession = () => {
  const activeToken = getActiveSessionToken();
  if (!activeToken) return;

  const sessions = getSessions().filter((session) => session.token !== activeToken);
  saveSessions(sessions);
  setActiveSessionToken(null);
};

const createDefaultUserData = (userId) => ({
  id: userId,
  walletEntries: [],
  savingsEntries: [],
  investmentsEntries: [],
  profileImage: "",
  profileImagePosition: { x: 50, y: 50 },
  settings: {
    theme: "light",
    hideBalance: false,
    currency: "NGN",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const getUserDataById = (userId) => {
  if (!userId) return createDefaultUserData();

  const userDataStore = getUserDataStore();
  const existing = userDataStore[userId] || createDefaultUserData(userId);
  const {
    profileImage: legacyProfileImage,
    profileImagePosition: legacyProfileImagePosition,
    ...existingSettings
  } = existing.settings || {};

  return {
    ...createDefaultUserData(userId),
    ...existing,
    profileImage: existing.profileImage ?? legacyProfileImage ?? "",
    profileImagePosition:
      existing.profileImagePosition ?? legacyProfileImagePosition ?? { x: 50, y: 50 },
    settings: {
      ...createDefaultUserData(userId).settings,
      ...existingSettings,
    },
  };
};

const persistUserData = () => {
  const userId = store.auth?.user?.id;
  if (!userId) return false;

  const userDataStore = getUserDataStore();
  userDataStore[userId] = {
    ...getUserDataById(userId),
    walletEntries: Array.isArray(store.data.walletEntries) ? [...store.data.walletEntries] : [],
    savingsEntries: Array.isArray(store.data.savingsEntries) ? [...store.data.savingsEntries] : [],
    investmentsEntries: Array.isArray(store.data.investmentsEntries) ? [...store.data.investmentsEntries] : [],
    profileImage: store.auth.user.profileImage || "",
    profileImagePosition: store.auth.user.profileImagePosition || { x: 50, y: 50 },
    settings: {
      theme: store.ui.theme || "light",
      hideBalance: Boolean(store.ui.hideBalance),
      currency: store.ui.currency || "NGN",
    },
    updatedAt: new Date().toISOString(),
  };

  return saveUserDataStore(userDataStore);
};

const loadUserData = (userId) => {
  const userData = getUserDataById(userId);

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", userData.settings.theme || "light");
  }

  fanout(store, "data.walletEntries", userData.walletEntries || []);
  fanout(store, "data.savingsEntries", userData.savingsEntries || []);
  fanout(store, "data.investmentsEntries", userData.investmentsEntries || []);
  store.ui.theme = userData.settings.theme || "light";
  store.ui.hideBalance = Boolean(userData.settings.hideBalance);
  store.ui.currency = userData.settings.currency || "NGN";
  store.auth.user = {
    ...store.auth.user,
    profileImage: userData.profileImage || "",
    profileImagePosition: userData.profileImagePosition || { x: 50, y: 50 },
  };
};

const clearLoadedUserData = () => {
  fanout(store, "data.walletEntries", []);
  fanout(store, "data.savingsEntries", []);
  fanout(store, "data.investmentsEntries", []);
  store.ui.theme = "light";
  store.ui.hideBalance = false;
  store.ui.currency = "NGN";
};

export const currentAuth = () => ({
  user: store.auth?.user || null,
  session: store.auth?.session || null,
  isAuthenticated: Boolean(store.auth?.isAuthenticated),
  authenticated: Boolean(store.auth?.authenticated),
  loading: Boolean(store.auth?.loading),
  status: store.auth?.status || "unauthenticated",
});

export const initializeAuth = async () => {
  const activeToken = getActiveSessionToken();
  if (!activeToken) {
    store.auth.user = null;
    store.auth.session = null;
    store.auth.isAuthenticated = false;
    store.auth.authenticated = false;
    store.auth.loading = false;
    store.auth.status = "unauthenticated";
    clearLoadedUserData();
    return { ok: false, error: "No active session." };
  }

  const session = getSessions().find(
    (entry) =>
      entry.token === activeToken &&
      (!entry.expiresAt || new Date(entry.expiresAt).getTime() > Date.now())
  );

  if (!session) {
    clearInvalidSession();
    store.auth.user = null;
    store.auth.session = null;
    store.auth.isAuthenticated = false;
    store.auth.authenticated = false;
    store.auth.loading = false;
    store.auth.status = "unauthenticated";
    clearLoadedUserData();
    return { ok: false, error: "Session expired." };
  }

  const userRecord = getRegisteredUsers().find((user) => user.id === session.userId);
  if (!userRecord) {
    clearInvalidSession();
    store.auth.user = null;
    store.auth.session = null;
    store.auth.isAuthenticated = false;
    store.auth.authenticated = false;
    store.auth.loading = false;
    store.auth.status = "unauthenticated";
    clearLoadedUserData();
    return { ok: false, error: "User session is invalid." };
  }

  const profile = {
    id: userRecord.id,
    name: userRecord.name || "User",
    phone: userRecord.phone || "",
    email: userRecord.email,
    createdAt: userRecord.createdAt || new Date().toISOString(),
  };

  store.auth.user = profile;
  store.auth.session = session;
  store.auth.isAuthenticated = true;
  store.auth.authenticated = true;
  store.auth.loading = false;
  store.auth.status = "authenticated";
  loadUserData(profile.id);
  return { ok: true, user: profile, session };
};

export const signUp = async (userData) => {
  const name = String(userData?.name || "").trim();
  const phone = String(userData?.phone || "").trim();
  const email = normalizeEmail(userData?.email);
  const password = String(userData?.password || "");

  if (!name || !phone || !email || !password) {
    return { ok: false, error: "Please fill in all fields." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const users = getRegisteredUsers();
  const emailExists = users.some(
    (entry) => normalizeEmail(entry.email) === email
  );

  if (emailExists) {
    return { ok: false, error: "An account with this email already exists." };
  }

  let passwordHash;
  try {
    passwordHash = await serializePassword(password);
  } catch (error) {
    return { ok: false, error: error.message };
  }
  const latestUsers = getRegisteredUsers();
  if (latestUsers.some((entry) => normalizeEmail(entry.email) === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const newUser = {
    id: userData?.id || generateId(),
    name,
    phone,
    email,
    passwordHash,
    createdAt: userData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  latestUsers.push(newUser);
  saveRegisteredUsers(latestUsers);

  const userDataStore = getUserDataStore();
  userDataStore[newUser.id] = createDefaultUserData(newUser.id);
  saveUserDataStore(userDataStore);

  const session = createSessionRecord(newUser.id);
  const profile = {
    id: newUser.id,
    name: newUser.name,
    phone: newUser.phone,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };

  store.auth.user = profile;
  store.auth.session = session;
  store.auth.isAuthenticated = true;
  store.auth.authenticated = true;
  store.auth.loading = false;
  store.auth.status = "authenticated";
  loadUserData(profile.id);

  return { ok: true, user: profile, session };
};

export const signIn = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  const rawPassword = String(password ?? "");

  if (!normalizedEmail || !rawPassword) {
    return { ok: false, error: "Email and password are required." };
  }

  const users = getRegisteredUsers();
  const matchedUser = users.find(
    (user) => normalizeEmail(user.email) === normalizedEmail
  );

  if (!matchedUser) {
    return { ok: false, error: "Invalid email or password." };
  }

  let providedHash;
  try {
    providedHash = await serializePassword(rawPassword);
  } catch (error) {
    return { ok: false, error: error.message };
  }
  const hasCurrentCredential = typeof matchedUser.passwordHash === "string";
  const legacyPasswordMatches =
    !hasCurrentCredential &&
    typeof matchedUser.password === "string" &&
    matchedUser.password === rawPassword.trim();

  if (hasCurrentCredential && matchedUser.passwordHash !== providedHash) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (!hasCurrentCredential && !legacyPasswordMatches) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (legacyPasswordMatches) {
    matchedUser.passwordHash = providedHash;
    delete matchedUser.password;
    matchedUser.updatedAt = new Date().toISOString();
    saveRegisteredUsers(users);
  }

  const session = createSessionRecord(matchedUser.id);
  const profile = {
    id: matchedUser.id,
    name: matchedUser.name || "User",
    phone: matchedUser.phone || "",
    email: matchedUser.email,
    createdAt: matchedUser.createdAt || new Date().toISOString(),
  };

  store.auth.user = profile;
  store.auth.session = session;
  store.auth.isAuthenticated = true;
  store.auth.authenticated = true;
  store.auth.loading = false;
  store.auth.status = "authenticated";
  loadUserData(profile.id);

  return { ok: true, user: profile, session };
};

export const signOut = () => {
  const currentToken = getActiveSessionToken();
  const sessions = getSessions().filter(
    (session) => session.token !== currentToken
  );
  saveSessions(sessions);
  setActiveSessionToken(null);

  store.auth.user = null;
  store.auth.session = null;
  store.auth.isAuthenticated = false;
  store.auth.authenticated = false;
  store.auth.loading = false;
  store.auth.status = "unauthenticated";
  store.auth.error = null;

  clearLoadedUserData();

  return { ok: true };
};

export const getSessionStorage = () => getSessions();

export const toggleTheme = () => {
  store.ui.theme = store.ui.theme === "light" ? "dark" : "light";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", store.ui.theme);
  }
  persistUserData();
};

export const toggleHideBalance = () => {
  store.ui.hideBalance = !store.ui.hideBalance;
  persistUserData();
};

export const updateProfileImage = (
  profileImage,
  profileImagePosition = store.auth.user?.profileImagePosition,
) => {
  if (
    typeof profileImage !== "string" ||
    (profileImage && !/^data:image\/jpeg;base64,/.test(profileImage))
  ) {
    return false;
  }

  if (!store.auth.user) return false;
  const previousUser = store.auth.user;
  store.auth.user = {
    ...previousUser,
    profileImage,
    profileImagePosition: profileImage
      ? profileImagePosition
      : { x: 50, y: 50 },
  };
  if (persistUserData()) return true;

  store.auth.user = previousUser;
  return false;
};

export const updateCurrency = (newCurrency) => {
  store.ui.currency = newCurrency;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", store.ui.theme);
  }
  persistUserData();
  refreshRates();
};

export const refreshRates = async () => {
  await fetchLiveExchangeRates();
  store.ui.ratesUpdatedAt = Date.now();
};

// Financial actions
export const addWalletEntry = (entry) => {
  const nextEntry = {
    ...entry,
    id: generateId(),
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
    createdAt: new Date().toISOString(),
  };
  fanout(store, "data.walletEntries", [...(store.data.walletEntries || []), nextEntry]);
  persistUserData();
};

export const updateWalletEntry = (id, updatedEntry) => {
  const entries = store.data.walletEntries || [];
  const index = entries.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    const updated = { ...entries[index], ...updatedEntry };
    const nextEntries = entries.map((entry, currentIndex) => (currentIndex === index ? updated : entry));
    fanout(store, "data.walletEntries", nextEntries);
    persistUserData();
  }
};

export const deleteWalletEntry = (id) => {
  const nextEntries = (store.data.walletEntries || []).filter((entry) => entry.id !== id);
  fanout(store, "data.walletEntries", nextEntries);
  persistUserData();
};

export const addSavingsEntry = (entry) => {
  const nextEntry = {
    ...entry,
    id: generateId(),
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
    createdAt: new Date().toISOString(),
    interestAccrued: 0,
  };
  fanout(store, "data.savingsEntries", [...(store.data.savingsEntries || []), nextEntry]);
  persistUserData();
};

export const updateSavingsEntry = (id, updatedEntry) => {
  const entries = store.data.savingsEntries || [];
  const index = entries.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    const updated = { ...entries[index], ...updatedEntry };
    const nextEntries = entries.map((entry, currentIndex) => (currentIndex === index ? updated : entry));
    fanout(store, "data.savingsEntries", nextEntries);
    persistUserData();
  }
};

export const deleteSavingsEntry = (id) => {
  const nextEntries = (store.data.savingsEntries || []).filter((entry) => entry.id !== id);
  fanout(store, "data.savingsEntries", nextEntries);
  persistUserData();
};

export const addInvestmentEntry = (entry) => {
  const nextEntry = {
    ...entry,
    id: generateId(),
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
    createdAt: new Date().toISOString(),
  };
  fanout(store, "data.investmentsEntries", [...(store.data.investmentsEntries || []), nextEntry]);
  persistUserData();
};

export const addMultipleInvestmentEntries = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const nextEntries = entries.map((entry) => ({
    ...entry,
    id: generateId(),
    baseCurrency: entry.baseCurrency || store.ui.currency || "NGN",
    createdAt: new Date().toISOString(),
  }));
  fanout(store, "data.investmentsEntries", [...(store.data.investmentsEntries || []), ...nextEntries]);
  persistUserData();
};

export const updateInvestmentEntry = (id, updatedEntry) => {
  const entries = store.data.investmentsEntries || [];
  const index = entries.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    const updated = { ...entries[index], ...updatedEntry };
    const nextEntries = entries.map((entry, currentIndex) => (currentIndex === index ? updated : entry));
    fanout(store, "data.investmentsEntries", nextEntries);
    persistUserData();
  }
};

export const deleteInvestmentEntry = (id) => {
  const nextEntries = (store.data.investmentsEntries || []).filter((entry) => entry.id !== id);
  fanout(store, "data.investmentsEntries", nextEntries);
  persistUserData();
};

export const calculateInterest = (entry) => {
  const daysDiff = Math.floor(
    (Date.now() - new Date(entry.createdAt)) / (1000 * 60 * 60 * 24)
  );
  const dailyInterest =
    (parseFloat(entry.amount) * (parseFloat(entry.interestRate) / 100)) / 365;
  return Math.max(0, dailyInterest * daysDiff);
};

export { getRegisteredUsers, saveRegisteredUsers, getSessions, saveSessions };