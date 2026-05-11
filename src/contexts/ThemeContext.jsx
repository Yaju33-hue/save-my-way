import React, { createContext, useContext, useState, useEffect } from "react";

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

  // LOAD SAVED SETTINGS ON MOUNT
  useEffect(() => {
    const savedTheme =
      localStorage.getItem("save-my-way-theme") || "light";
    const savedHideBalance =
      localStorage.getItem("save-my-way-hide-balance") === "true";
    const savedCurrency =
      localStorage.getItem("save-my-way-currency") || "NGN";

    setTheme(savedTheme);
    setHideBalance(savedHideBalance);
    setCurrency(savedCurrency);

    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // APPLY THEME EVERY TIME IT CHANGES
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("save-my-way-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      localStorage.setItem("save-my-way-hide-balance", !prev);
      return !prev;
    });
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