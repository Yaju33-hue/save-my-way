import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import ScrollToTop from "../components/ScrollToTop.jsx";

import SignUp from "../pages/SignUp.jsx";
import SignIn from "../pages/SignIn.jsx";
import MainApp from "../pages/MainApp.jsx";
import { PrivacyPolicy, TermsOfService } from "../pages/LegalInfo.jsx";

export default function AppRouter() {
  const state = useReactor(store);
  const location = useLocation();
  // User is authenticated only if isAuthenticated is true AND user object is present
  const isAuthenticated = Boolean(state.auth?.isAuthenticated && state.auth?.user);
  const isPublicRoute = ["/signin", "/signup", "/privacy", "/terms"].includes(
    location.pathname,
  );

  if (state.auth?.loading && !isPublicRoute) {
    return (
      <div className="session-loading" role="status">
        Restoring your session...
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Public Authentication Routes */}
        <Route
          path="/signin"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignUp />}
        />

        {/* Protected App Routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <MainApp />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
      </Routes>
    </>
  );
}