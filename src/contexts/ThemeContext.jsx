import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState("NGN");
  const { user } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem("save-my-way-theme") || "light";
    const savedHideBalance =
      localStorage.getItem("save-my-way-hide-balance") === "true";
    const savedCurrency = localStorage.getItem("save-my-way-currency") || "NGN";

    setTheme(savedTheme);
    setHideBalance(savedHideBalance);
    setCurrency(savedCurrency);

    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("save-my-way-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleHideBalance = () => {
    const newHideBalance = !hideBalance;
    setHideBalance(newHideBalance);
    localStorage.setItem("save-my-way-hide-balance", newHideBalance);
  };

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem("save-my-way-currency", newCurrency);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        hideBalance,
        currency,
        toggleTheme,
        toggleHideBalance,
        updateCurrency,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
