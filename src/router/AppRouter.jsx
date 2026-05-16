import React from "react";
import { Routes, Route } from "react-router-dom";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";

import SignUp from "../pages/SignUp.jsx";
import SignIn from "../pages/SignIn.jsx";
import MainApp from "../pages/MainApp.jsx";

export default function AppRouter() {
  const state = useReactor(store);
  const isAuthenticated = state.auth.isAuthenticated;

  return (
    <Routes>
      <Route path="/*" element={<MainApp />} />
      {!isAuthenticated && (
        <>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
        </>
      )}
    </Routes>
  );
}