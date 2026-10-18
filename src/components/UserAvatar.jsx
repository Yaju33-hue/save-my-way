import React from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";

export default function UserAvatar({ user: propUser, size = 24, className = "" }) {
  const state = useReactor(store);
  const user = propUser || state.auth.user;

  const avatarUrl = user?.avatarUrl;
  const name = user?.name || user?.email || "User";

  const getInitials = (str) => {
    if (!str) return "U";
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: "50%",
    fontSize: `${Math.max(10, Math.round(size * 0.42))}px`,
  };

  if (avatarUrl) {
    return (
      <div className={`user-avatar-wrap ${className}`} style={style}>
        <img
          src={avatarUrl}
          alt={name}
          className="user-avatar-img"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`user-avatar-wrap user-avatar-fallback ${className}`}
      style={style}
      aria-label={name}
      title={name}
    >
      <span className="user-avatar-initials">{initials}</span>
    </div>
  );
}
