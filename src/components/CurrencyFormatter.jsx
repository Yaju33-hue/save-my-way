import React from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function CurrencyFormatter({ amount, className = "" }) {
  const { hideBalance, currency } = useTheme();

  if (hideBalance) {
    return <span className={`amount hidden ${className}`}>****</span>;
  }

  return (
    <span className={`amount ${className}`}>
      {amount.toLocaleString("en-NG", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}
