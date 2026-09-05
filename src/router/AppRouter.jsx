import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import ScrollToTop from "../components/ScrollToTop.jsx";

import SignUp from "../pages/SignUp.jsx";
import SignIn from "../pages/SignIn.jsx";
import MainApp from "../pages/MainApp.jsx";

export default function AppRouter() {
  const state = useReactor(store);
  // User is authenticated only if isAuthenticated is true AND user object is present
  const isAuthenticated = Boolean(state.auth?.isAuthenticated && state.auth?.user);

  return (
    <>
      <ScrollToTop />
      <Routes>
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