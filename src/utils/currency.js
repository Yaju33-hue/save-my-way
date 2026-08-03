export const CURRENCY_SYMBOLS = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "₵",
};

// Default fallback exchange rates relative to USD base (1 USD)
export const DEFAULT_EXCHANGE_RATES = {
  USD: 1,
  NGN: 1361.41,
  EUR: 0.8667,
  GBP: 0.7417,
  GHS: 11.686,
};

let liveRates = { ...DEFAULT_EXCHANGE_RATES };

try {
  const cached = typeof localStorage !== "undefined" ? localStorage.getItem("save_my_way_live_rates") : null;
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed && parsed.rates) {
      liveRates = { ...DEFAULT_EXCHANGE_RATES, ...parsed.rates };
    }
  }
} catch (e) {
  // Ignore storage error
}

export async function fetchLiveExchangeRates() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) return liveRates;
    const data = await response.json();
    if (data && data.result === "success" && data.rates) {
      const newRates = {
        USD: Number(data.rates.USD) || 1,
        NGN: Number(data.rates.NGN) || liveRates.NGN,
        EUR: Number(data.rates.EUR) || liveRates.EUR,
        GBP: Number(data.rates.GBP) || liveRates.GBP,
        GHS: Number(data.rates.GHS) || liveRates.GHS,
      };
      liveRates = newRates;
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(
            "save_my_way_live_rates",
            JSON.stringify({ rates: newRates, updatedAt: new Date().toISOString() })
          );
        }
      } catch (e) {}
    }
  } catch (error) {
    console.warn("Could not fetch live exchange rates, using cached/default rates.", error);
  }
  return liveRates;
}

// Fetch rates on initialization
if (typeof window !== "undefined") {
  fetchLiveExchangeRates();
}

export function getExchangeRates() {
  return liveRates;
}

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function convertCurrency(amount, fromCurrency = "NGN", toCurrency = "NGN") {
  const numericAmount = Number(amount) || 0;
  const from = fromCurrency || "NGN";
  const to = toCurrency || "NGN";

  if (from === to) {
    return numericAmount;
  }

  const rates = getExchangeRates();
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;

  const amountInUSD = numericAmount / fromRate;
  return amountInUSD * toRate;
}

export function formatCurrency(amount, targetCurrency = "NGN", fromCurrency = targetCurrency) {
  const converted = convertCurrency(amount, fromCurrency, targetCurrency);
  const symbol = getCurrencySymbol(targetCurrency);
  return `${symbol}${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}


