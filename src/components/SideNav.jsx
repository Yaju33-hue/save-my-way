import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaWallet,
  FaPiggyBank,
  FaUniversity,
  FaUser,
} from "react-icons/fa";

const navItems = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/wallet", label: "Wallet", icon: FaWallet },
  { path: "/savings", label: "Savings", icon: FaPiggyBank },
  { path: "/investments", label: "Investments", icon: FaUniversity },
  { path: "/account", label: "Account", icon: FaUser },
];

export default function SideNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="side-nav">
      <div className="sidebar-brand">
        <img
          className="sidebar-logo-img"
          src="/WhatsApp Image 2025-12-06 at 20.53.53_bec4e93d.jpg"
          alt="SaveMyWay Logo"
        />
        <div className="sidebar-brand-text">
          <span className="brand-name">SaveMyWay</span>
          <span className="brand-tagline">Finance Tracker</span>
        </div>
      </div>

      <nav className="side-nav-links">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            className={`nav-item ${isActive(path) ? "active" : ""}`}
            to={path}
          >
            <Icon className="nav-icon" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}