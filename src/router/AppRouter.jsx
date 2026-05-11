import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import SignUp from "../pages/SignUp.jsx";
import SignIn from "../pages/SignIn.jsx";
import MainApp from "../pages/MainApp.jsx";
import DataProvider from "../contexts/DataContext.jsx";

export default function AppRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="container"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route
            path="/*"
            element={
              <DataProvider>
                <MainApp />
              </DataProvider>
            }
          />
        </>
      )}
    </Routes>
  );
}