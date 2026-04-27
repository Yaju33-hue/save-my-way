import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaWallet, FaPiggyBank, FaUser } from "react-icons/fa";

const navItems = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/wallet", label: "Wallet", icon: FaWallet },
  { path: "/savings", label: "Savings", icon: FaPiggyBank },
  { path: "/account", label: "Account", icon: FaUser },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, label, icon: Icon }) => (
        <button
          key={path}
          className={`nav-item ${isActive(path) ? "active" : ""}`}
          onClick={() => navigate(path)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
