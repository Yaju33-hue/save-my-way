import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem("save-my-way-user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const signUp = (email, password) => {
    const newUser = {
      id: Date.now().toString(),
      email,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("save-my-way-user", JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const signIn = (email, password) => {
    const savedUser = localStorage.getItem("save-my-way-user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUser(user);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const signOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("save-my-way-user");
    // Keep wallet/savings data
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
