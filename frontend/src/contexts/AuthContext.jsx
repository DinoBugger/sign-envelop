import { createContext, useEffect, useMemo, useState } from "react";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../services/authService.js";

export const AuthContext = createContext(null);

const decodeTokenPayload = (token) => {
  if (typeof token !== "string" || token.split(".").length < 2) {
    return null;
  }

  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userMessage, setUserMessage] = useState("Ready to sign in or create an account.");
  const [isBootstrapping, setIsBootstrapping] = useState(true); // if bootstrapping is true, display loading page

  const setSession = (nextToken) => {
    const token = typeof nextToken === "string" ? nextToken : "";
    setAccessToken(token);
    setCurrentUser(decodeTokenPayload(token));
  };

  const handleAuthResponse = async (action, payload) => {
    // General Action for both Register and Login
    const response = await action(payload);

    if (response?.accessToken) {
      setSession(response.accessToken);
    }

    if (response?.message) {
      setUserMessage(response.message);
    }

    return response;
  };

  const register = async (payload) => {
    return handleAuthResponse(registerUser, payload);
  };

  const login = async (payload) => {
    return handleAuthResponse(loginUser, payload);
  };

  const logout = async () => {
    try {
      const response = await logoutUser();
      setSession("");
      setCurrentUser(null);
      setUserMessage(response?.message || "Logged out successfully.");
      return response;
    } catch (error) {
      setSession("");
      setCurrentUser(null);
      setUserMessage(error.message);
      throw error;
    }
  };

  const restoreSession = async () => {
    try {
      const response = await refreshAccessToken();
      if (response?.accessToken) {
        setSession(response.accessToken);
        setUserMessage(response.message || "Session restored successfully.");
        return true;
      }

      setSession("");
      setCurrentUser(null);
      return false;
    } catch {
      setSession("");
      setCurrentUser(null);
      return false;
    }
  };

  useEffect(() => {
    // Because all in-memory states are deleted whenever user refresh website => lost accessToken's state
    // Restore sesstion to reissue accessToken
    restoreSession().finally(() => {
      setIsBootstrapping(false); // turn off loading display after reloading accessToken
    });
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      currentUser,
      userMessage,
      isBootstrapping,
      register,
      login,
      logout,
      restoreSession,
      setUserMessage,
    }),
    [accessToken, currentUser, isBootstrapping, userMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
