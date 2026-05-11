import React, { useState, useEffect } from "react";
import AuthProvider from "./contexts/AuthContext.jsx";
import ThemeProvider from "./contexts/ThemeContext.jsx";
import AppRouter from "./router/AppRouter.jsx";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="App">
          <AppRouter />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;