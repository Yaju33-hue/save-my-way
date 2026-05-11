import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import Home from "./Home.jsx";
import Wallet from "./Wallet.jsx";
import Savings from "./Savings.jsx";
import Account from "./Account.jsx";
import AddWalletEntry from "./AddWalletEntry.jsx";
import AddSavingsEntry from "./AddSavingsEntry.jsx";
import BottomNav from "../components/BottomNav.jsx";
import SideNav from "../components/SideNav.jsx";

export default function MainApp() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <SideNav />

      <div className="main-content">
        <main
          className="container"
          style={{ paddingBottom: "80px", paddingTop: "20px" }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/wallet/add" element={<AddWalletEntry />} />
            <Route path="/wallet/edit/:id" element={<AddWalletEntry />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/savings/add" element={<AddSavingsEntry />} />
            <Route path="/savings/edit/:id" element={<AddSavingsEntry />} />
            <Route path="/account" element={<Account onLogout={signOut} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Mobile Bottom Nav (hidden on desktop via CSS) */}
        {location.pathname !== "/account" && <BottomNav />}
      </div>
    </div>
  );
}