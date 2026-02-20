import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import api from "../api/apiClient";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.clear();
        return null;
      }
      return decoded;
    } catch (err) {
      localStorage.clear();
      return null;
    }
  });

  const login = (access, refresh) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    const decoded = jwtDecode(access);
    setUser(decoded);
  };

  const logout = async () => {
    const refresh = localStorage.getItem("refresh");
    
    // Blacklist refresh token on backend
    if (refresh) {
      try {
        await api.post("/auth/logout/", { refresh });
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
    
    localStorage.clear();
    setUser(null);
    showToast.success("Logged out successfully");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
