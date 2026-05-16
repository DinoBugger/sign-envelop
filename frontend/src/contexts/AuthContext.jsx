import { createContext, useEffect, useMemo, useState } from "react";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../services/authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState("");
  const [userMessage, setUserMessage] = useState("Ready to sign in or create an account.");
  const [isBootstrapping, setIsBootstrapping] = useState(true); // if bootstrapping is true, display loading page

  const setSession = (nextToken) => {
    setAccessToken(typeof nextToken === "string" ? nextToken : "");
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
      setUserMessage(response?.message || "Logged out successfully.");
      return response;
    } catch (error) {
      setSession("");
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
      return false;
    } catch {
      setSession("");
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
      userMessage,
      isBootstrapping,
      register,
      login,
      logout,
      restoreSession,
      setUserMessage,
    }),
    [accessToken, isBootstrapping, userMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
