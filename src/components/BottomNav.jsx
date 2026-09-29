import React, { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaWallet, FaPiggyBank, FaUniversity, FaUser } from "react-icons/fa";
import ProfileAvatar from "./ProfileAvatar.jsx";

const navItems = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/wallet", label: "Wallet", icon: FaWallet },
  { path: "/savings", label: "Savings", icon: FaPiggyBank },
  { path: "/investments", label: "Investments", icon: FaUniversity },
  { path: "/account", label: "Account", icon: FaUser },
];

export default function BottomNav() {
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
        offsetX: linkRect.left - navRect.left,
        offsetY: linkRect.top - navRect.top,
        width: linkRect.width,
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
    <nav className="bottom-nav" aria-label="Main navigation" ref={navRef}>
      {activeIndicator && (
        <span
          className="bottom-nav-active-indicator"
          aria-hidden="true"
          style={{
            height: `${activeIndicator.height}px`,
            width: `${activeIndicator.width}px`,
            transform: `translate(${activeIndicator.offsetX}px, ${activeIndicator.offsetY}px)`,
          }}
        />
      )}
      {navItems.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          className={`nav-item ${isActive(path) ? "active" : ""} ${path === "/account" ? "nav-item-account" : ""}`}
          to={path}
          aria-current={isActive(path) ? "page" : undefined}
        >
          {path === "/account" ? <ProfileAvatar /> : <Icon />}
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
