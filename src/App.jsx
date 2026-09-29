import React, { useEffect } from "react";
import AppRouter from "./router/AppRouter.jsx";
import { TimeTravelOverlay } from "sia-reactor/adapters/react";
import { timeTravel } from "./store/index.js";
import { initializeAuth, signOut } from "./store/actions.js";
import "sia-reactor/styles/time-travel-overlay.css";
import "./App.css";

function App() {
  useEffect(() => {
    let active = true;
    let expiryTimer = null;
    const restoreSession = () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      initializeAuth()
        .then((result) => {
          if (!active) return;
          if (!result.ok) {
            signOut();
            return;
          }

          const expiresAt = new Date(result.session.expiresAt).getTime();
          if (Number.isFinite(expiresAt)) {
            expiryTimer = setTimeout(signOut, Math.max(0, expiresAt - Date.now()));
          }
        })
        .catch(() => {
          if (active) signOut();
        });
    };

    const handleSessionStorage = (event) => {
      if (event.key === "save_my_way_active_session") restoreSession();
    };

    window.addEventListener("storage", handleSessionStorage);
    restoreSession();

    return () => {
      active = false;
      if (expiryTimer) clearTimeout(expiryTimer);
      window.removeEventListener("storage", handleSessionStorage);
    };
  }, []);

  return (
    <div className="App">
      <AppRouter />
      <TimeTravelOverlay time={timeTravel} color="#06b6d4" startOpen={false} devOnly />
    </div>
  );
}

export default App;
