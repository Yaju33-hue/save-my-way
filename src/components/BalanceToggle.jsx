import React from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function BalanceToggle() {
  const { hideBalance, toggleHideBalance } = useTheme();

  return (
    <div className="toggle-container">
      <span className="bold">Hide Balances</span>
      <button className="toggle-btn" onClick={toggleHideBalance}>
        {hideBalance ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  );
}
