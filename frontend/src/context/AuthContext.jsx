import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(
    Boolean(localStorage.getItem("access")),
  );

  function clearSession() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setCurrentUser(null);
  }

  async function loadCurrentUser() {
    const accessToken = localStorage.getItem("access");

    if (!accessToken) {
      setCurrentUser(null);
      setAuthLoading(false);
      return null;
    }

    setAuthLoading(true);

    try {
      const response = await api.get("/accounts/me/");
      const session = response.data;

      setCurrentUser(session);
      localStorage.setItem("role", session.role);
      localStorage.setItem("username", session.user.username);

      return session;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    clearSession();
  }

  useEffect(() => {
    if (localStorage.getItem("access")) {
      loadCurrentUser().catch(() => {});
    } else {
      setAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || localStorage.getItem("role"),
        authLoading,
        loadCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
