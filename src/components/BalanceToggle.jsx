import React from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { toggleHideBalance } from "../store/actions.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function BalanceToggle() {
  const state = useReactor(store);

  return (
    <div className="toggle-container">
      <span className="bold">Hide Balances</span>
      <button className="toggle-btn" onClick={toggleHideBalance}>
        {state.ui.hideBalance ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  );
}
