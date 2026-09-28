import React, { useEffect } from "react";
import AppRouter from "./router/AppRouter.jsx";
import { TimeTravelOverlay } from "sia-reactor/adapters/react";
import { timeTravel } from "./store/index.js";
import { initializeAuth } from "./store/actions.js";
import "sia-reactor/styles/time-travel-overlay.css";
import "./App.css";

function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <div className="App">
      <AppRouter />
      <TimeTravelOverlay time={timeTravel} color="#06b6d4" startOpen={false} devOnly />
    </div>
  );
}

export default App;
