import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access");
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch (err) {
      console.error("INVALID TOKEN IN STORAGE → Clearing...");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return null;
    }
  });

  const login = (access, refresh) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    const decoded = jwtDecode(access);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
