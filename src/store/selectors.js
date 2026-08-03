import { calculateInterest } from "./actions.js";
import { convertCurrency } from "../utils/currency.js";

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const parseNumber = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getMonthlyActivationDate = (entry, now, created) => {
  const day = Math.min(parseNumber(entry.dayOfMonth, 1), getDaysInMonth(now.getFullYear(), now.getMonth()));
  let candidate = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0, 0);

  if (candidate < created) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const nextDay = Math.min(day, getDaysInMonth(nextMonth.getFullYear(), nextMonth.getMonth()));
    candidate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextDay, 0, 0, 0, 0);
  }

  return candidate;
};

const getYearlyActivationDate = (entry, now, created) => {
  const month = Math.max(1, Math.min(12, parseNumber(entry.month, 1))) - 1;
  const day = Math.min(parseNumber(entry.dayOfYear, 1), getDaysInMonth(now.getFullYear(), month));
  let candidate = new Date(now.getFullYear(), month, day, 0, 0, 0, 0);

  if (candidate < created || candidate < now) {
    const nextYear = now.getFullYear() + 1;
    const nextDay = Math.min(day, getDaysInMonth(nextYear, month));
    candidate = new Date(nextYear, month, nextDay, 0, 0, 0, 0);
  }

  return candidate;
};

const isRecurringEntryActive = (entry) => {
  if (!entry.recurring) return true;
  const now = new Date();
  const created = new Date(entry.createdAt || now);
  if (Number.isNaN(created.getTime())) return true;

  const frequency = entry.frequency || "daily";
  if (frequency === "daily" || frequency === "weekly") {
    return now >= created;
  }

  if (frequency === "monthly") {
    const dueDate = getMonthlyActivationDate(entry, now, created);
    return now >= dueDate;
  }

  if (frequency === "yearly") {
    const dueDate = getYearlyActivationDate(entry, now, created);
    return now >= dueDate;
  }

  return now >= created;
};

export const isPendingRecurringEntry = (entry) => entry.recurring && !isRecurringEntryActive(entry);

// Selectors for derived state
// Computed values migrated from DataContext

export const selectWalletTotal = (state) => {
  const targetCurrency = state.ui.currency || "NGN";
  return state.data.walletEntries.reduce((total, entry) => {
    if (!isRecurringEntryActive(entry)) {
      return total;
    }

    const rawAmount = parseFloat(entry.amount) || 0;
    const fromCurrency = entry.baseCurrency || "NGN";
    const amount = convertCurrency(rawAmount, fromCurrency, targetCurrency);
    return entry.type === "incoming" ? total + amount : total - amount;
  }, 0);
};

export const selectSavingsTotal = (state) => {
  const targetCurrency = state.ui.currency || "NGN";
  return state.data.savingsEntries.reduce((total, entry) => {
    const rawAmount = parseFloat(entry.amount) || 0;
    const rawInterest = calculateInterest(entry);
    const fromCurrency = entry.baseCurrency || "NGN";
    const amount = convertCurrency(rawAmount, fromCurrency, targetCurrency);
    const interest = convertCurrency(rawInterest, fromCurrency, targetCurrency);
    return total + amount + interest;
  }, 0);
};

export const selectTotalInterest = (state) => {
  const targetCurrency = state.ui.currency || "NGN";
  return state.data.savingsEntries.reduce((total, entry) => {
    const rawInterest = calculateInterest(entry);
    const fromCurrency = entry.baseCurrency || "NGN";
    return total + convertCurrency(rawInterest, fromCurrency, targetCurrency);
  }, 0);
};

export const selectInvestmentsTotal = (state) => {
  const targetCurrency = state.ui.currency || "NGN";
  const entries = state.data.investmentsEntries || [];
  return entries.reduce((total, entry) => {
    const shares = parseFloat(entry.amount) || 0;
    const currentPrice = parseFloat(entry.currentPrice) || 0;
    const rawValue = shares * currentPrice;
    const fromCurrency = entry.baseCurrency || "NGN";
    return total + convertCurrency(rawValue, fromCurrency, targetCurrency);
  }, 0);
};

export const selectInvestmentProfitLoss = (state) => {
  const targetCurrency = state.ui.currency || "NGN";
  const entries = state.data.investmentsEntries || [];
  return entries.reduce((total, entry) => {
    const shares = parseFloat(entry.amount) || 0;
    const currentPrice = parseFloat(entry.currentPrice) || 0;
    const rawValue = shares * currentPrice;
    const rawSpent = parseFloat(entry.amountSpent) || 0;
    const fromCurrency = entry.baseCurrency || "NGN";
    const convertedValue = convertCurrency(rawValue, fromCurrency, targetCurrency);
    const convertedSpent = convertCurrency(rawSpent, fromCurrency, targetCurrency);
    return total + (convertedValue - convertedSpent);
  }, 0);
};

// Combined selector for all financial totals
export const selectFinancialTotals = (state) => ({
  walletTotal: selectWalletTotal(state),
  savingsTotal: selectSavingsTotal(state),
  totalInterest: selectTotalInterest(state),
  investmentsTotal: selectInvestmentsTotal(state),
  investmentProfitLoss: selectInvestmentProfitLoss(state),
});