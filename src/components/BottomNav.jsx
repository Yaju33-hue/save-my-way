import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaWallet, FaPiggyBank, FaUniversity, FaUser } from "react-icons/fa";

const navItems = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/wallet", label: "Wallet", icon: FaWallet },
  { path: "/savings", label: "Savings", icon: FaPiggyBank },
  { path: "/investments", label: "Investments", icon: FaUniversity },
  { path: "/account", label: "Account", icon: FaUser },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          className={`nav-item ${isActive(path) ? "active" : ""}`}
          to={path}
          aria-current={isActive(path) ? "page" : undefined}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
