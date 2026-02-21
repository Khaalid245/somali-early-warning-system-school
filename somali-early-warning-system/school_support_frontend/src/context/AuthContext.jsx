import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import api from "../api/apiClient";

/**
 * AuthContext - Manages user authentication state and JWT tokens
 * Handles login, logout, and token validation
 */

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access");
    console.log("[AuthContext] Token:", token ? "exists" : "null");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      console.log("[AuthContext] Decoded user:", decoded);
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        console.log("[AuthContext] Token expired");
        localStorage.clear();
        return null;
      }
      return decoded;
    } catch (err) {
      console.log("[AuthContext] Token decode error:", err);
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

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
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
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
