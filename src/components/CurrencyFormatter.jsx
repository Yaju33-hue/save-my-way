import React from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";

const currencySymbols = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "₵",
};

export default function CurrencyFormatter({ amount, className = "" }) {
  const state = useReactor(store);
  const hideBalance = state.ui.hideBalance;
  const currency = state.ui.currency;
  const symbol = currencySymbols[currency] ?? currency;

  if (hideBalance) {
    return <span className={`amount hidden ${className}`}>****</span>;
  }

  return (
    <span className={`amount ${className}`}>
      {symbol}
      {amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}
