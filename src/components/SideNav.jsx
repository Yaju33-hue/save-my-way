import { Link, useLocation } from "react-router-dom";

export default function SideNav() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="side-nav">
      <h2 className="logo">SaveMyWay</h2>

      <nav className="side-nav-links">
        <Link className={`nav-item ${isActive("/") ? "active" : ""}`} to="/">
          Home
        </Link>

        <Link
          className={`nav-item ${isActive("/wallet") ? "active" : ""}`}
          to="/wallet"
        >
          Wallet
        </Link>

        <Link
          className={`nav-item ${isActive("/savings") ? "active" : ""}`}
          to="/savings"
        >
          Savings
        </Link>

        <Link
          className={`nav-item ${isActive("/account") ? "active" : ""}`}
          to="/account"
        >
          Account
        </Link>
      </nav>
    </aside>
  );
}