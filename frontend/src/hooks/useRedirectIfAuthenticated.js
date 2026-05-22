import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth.js";

const WARNING_STORAGE_KEY = "auth-redirect-warning-shown";

export const useRedirectIfAuthenticated = ({ showWarning = false } = {}) => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!accessToken || hasRedirected.current) {
      return;
    }

    hasRedirected.current = true;

    if (showWarning && typeof window !== "undefined") {
      const hasShownWarning = window.sessionStorage.getItem(WARNING_STORAGE_KEY) === "true";

      if (!hasShownWarning) {
        window.sessionStorage.setItem(WARNING_STORAGE_KEY, "true");
        toast.warning("Vui lòng đăng xuất để sử dụng tài khoản khác");
      }
    }

    navigate("/", { replace: true });
  }, [accessToken, navigate, showWarning]);
};