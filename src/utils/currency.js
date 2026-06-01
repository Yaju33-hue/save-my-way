const CURRENCY_SYMBOLS = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "₵",
};

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatCurrency(amount, currency) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
