import React from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { formatCurrency } from "../utils/currency.js";

export default function CurrencyFormatter({ amount, fromCurrency, className = "" }) {
  const state = useReactor(store);
  const hideBalance = state.ui.hideBalance;
  const currency = state.ui.currency;

  if (hideBalance) {
    return <span className={`amount hidden ${className}`}>••••</span>;
  }

  const originCurrency = fromCurrency ?? currency;

  return (
    <span className={`amount ${className}`}>
      {formatCurrency(amount, currency, originCurrency)}
    </span>
  );
}

