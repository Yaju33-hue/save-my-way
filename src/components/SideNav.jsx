import React, { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaWallet,
  FaPiggyBank,
  FaUniversity,
  FaUser,
} from "react-icons/fa";
import ProfileAvatar from "./ProfileAvatar.jsx";

const navItems = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/wallet", label: "Wallet", icon: FaWallet },
  { path: "/savings", label: "Savings", icon: FaPiggyBank },
  { path: "/investments", label: "Investments", icon: FaUniversity },
  { path: "/account", label: "Account", icon: FaUser },
];

export default function SideNav() {
  const location = useLocation();
  const navRef = useRef(null);
  const [activeIndicator, setActiveIndicator] = useState(null);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  useLayoutEffect(() => {
    const nav = navRef.current;
    const activeLink = nav?.querySelector(".nav-item.active");
    if (!nav || !activeLink) return undefined;

    const updateIndicator = () => {
      const navRect = nav.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setActiveIndicator({
        offset: linkRect.top - navRect.top,
        height: linkRect.height,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateIndicator);
    observer?.observe(nav);
    observer?.observe(activeLink);

    return () => {
      window.removeEventListener("resize", updateIndicator);
      observer?.disconnect();
    };
  }, [location.pathname]);

  return (
    <aside className="side-nav">
      <div className="sidebar-brand">
        <img
          className="sidebar-logo-img"
          src={`${import.meta.env.BASE_URL}${encodeURIComponent("WhatsApp Image 2025-12-06 at 20.53.53_bec4e93d.jpg")}`}
          alt="SaveMyWay Logo"
        />
        <div className="sidebar-brand-text">
          <span className="brand-name">SaveMyWay</span>
          <span className="brand-tagline">Finance Tracker</span>
        </div>
      </div>

      <nav className="side-nav-links" aria-label="Main navigation" ref={navRef}>
        {activeIndicator && (
          <span
            className="side-nav-active-indicator"
            aria-hidden="true"
            style={{
              height: `${activeIndicator.height}px`,
              transform: `translateY(${activeIndicator.offset}px)`,
            }}
          />
        )}
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            className={`nav-item ${isActive(path) ? "active" : ""}`}
            to={path}
            aria-current={isActive(path) ? "page" : undefined}
          >
            {path === "/account" ? (
              <ProfileAvatar className="profile-avatar-sm" />
            ) : (
              <Icon className="nav-icon" />
            )}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}