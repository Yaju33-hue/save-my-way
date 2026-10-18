import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaWallet, FaPiggyBank, FaUniversity } from "react-icons/fa";
import UserAvatar from "./UserAvatar.jsx";

const navTabs = [
  {
    path: "/",
    label: "Home",
    icon: FaHome,
    isAvatar: false,
    isActive: (pathname) => pathname === "/" || pathname === "",
  },
  {
    path: "/wallet",
    label: "Wallet",
    icon: FaWallet,
    isAvatar: false,
    isActive: (pathname) => pathname.startsWith("/wallet"),
  },
  {
    path: "/savings",
    label: "Savings",
    icon: FaPiggyBank,
    isAvatar: false,
    isActive: (pathname) => pathname.startsWith("/savings"),
  },
  {
    path: "/investments",
    label: "Investments",
    icon: FaUniversity,
    isAvatar: false,
    isActive: (pathname) => pathname.startsWith("/investments"),
  },
  {
    path: "/account",
    label: "My Stuff",
    icon: null,
    isAvatar: true,
    isActive: (pathname) => pathname.startsWith("/account"),
  },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav-dock" aria-label="Bottom Navigation">
      <div className="bottom-nav-inner">
        {navTabs.map(({ path, label, icon: Icon, isAvatar, isActive }) => {
          const active = isActive(location.pathname);
          return (
            <Link
              key={path}
              to={path}
              className={`nav-tab-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <div className="nav-tab-capsule">
                <div className="nav-tab-icon-wrap">
                  {isAvatar ? (
                    <UserAvatar
                      size={22}
                      className={`nav-avatar-icon ${active ? "nav-avatar-active" : ""}`}
                    />
                  ) : (
                    <Icon className="nav-icon-svg" />
                  )}
                </div>
                <span className="nav-tab-label">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
