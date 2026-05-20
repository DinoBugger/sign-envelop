import { createContext, useEffect, useMemo, useState } from "react";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../services/authService.js";
import { toast } from "react-toastify";

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

const translateAuthErrorMessage = (message) => {
  const normalizedMessage = typeof message === "string" ? message : "";

  const translations = {
    "Invalid email or password!": "Email hoặc mật khẩu không chính xác.",
    "Username already exists!": "Tên người dùng đã tồn tại.",
    "Email already exists!": "Email đã tồn tại.",
    "refreshToken is required.": "Thiếu refresh token.",
    "Refresh token is invalid or expired.": "Refresh token không hợp lệ hoặc đã hết hạn.",
    "Refresh token is invalid.": "Refresh token không hợp lệ.",
    "Refresh token has been revoked or does not exist.": "Refresh token đã bị thu hồi hoặc không tồn tại.",
    "Refresh token has expired.": "Refresh token đã hết hạn.",
    "User does not exist.": "Tài khoản không tồn tại.",
    "Email and OTP code are required.": "Vui lòng nhập email và mã OTP.",
    "Invalid OTP code.": "Mã OTP không hợp lệ.",
    "Too many attempts. Please request a new OTP.": "Bạn đã thử quá nhiều lần. Vui lòng yêu cầu mã OTP mới.",
    "Server error!": "Đã xảy ra lỗi máy chủ.",
  };

  return translations[normalizedMessage] || normalizedMessage || "Xác thực không thành công.";
};

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userMessage, setUserMessage] = useState("Sẵn sàng đăng nhập hoặc tạo tài khoản.");
  const [isBootstrapping, setIsBootstrapping] = useState(true); // khi đang khởi tạo thì hiển thị màn hình tải

  const setSession = (nextToken) => {
    const token = typeof nextToken === "string" ? nextToken : "";
    setAccessToken(token);
    setCurrentUser(decodeTokenPayload(token));
  };

  const handleAuthResponse = async (action, payload, successMessage) => {
    // Dùng chung cho cả đăng ký và đăng nhập
    try {
      const response = await action(payload);

      if (response?.accessToken) {
        setSession(response.accessToken);
      }

      if (successMessage) {
        setUserMessage(successMessage);
        toast.success(successMessage);
      }

      return response;
    } catch (error) {
      const translatedError = translateAuthErrorMessage(error.message);
      toast.error(translatedError);
      throw error;
    }
  };

  const register = async (payload) => {
    return handleAuthResponse(registerUser, payload, "Đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra hộp thư để tiếp tục.");
  };

  const login = async (payload) => {
    return handleAuthResponse(loginUser, payload, "Đăng nhập thành công.");
  };

  const logout = async () => {
    try {
      const response = await logoutUser();
      setSession("");
      setCurrentUser(null);
      setUserMessage("Đăng xuất thành công.");
      toast.success("Đăng xuất thành công.");
      return response;
    } catch (error) {
      setSession("");
      setCurrentUser(null);
      setUserMessage("Đăng xuất không thành công.");
      toast.error(translateAuthErrorMessage(error.message) || "Đăng xuất không thành công.");
      throw error;
    }
  };

  const restoreSession = async () => {
    try {
      const response = await refreshAccessToken();
      if (response?.accessToken) {
        setSession(response.accessToken);
        setUserMessage("Đã khôi phục phiên đăng nhập.");
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
    // Vì trạng thái trong bộ nhớ bị mất khi tải lại trang nên cần khôi phục phiên để cấp lại accessToken
    restoreSession().finally(() => {
      setIsBootstrapping(false); // tắt màn hình tải sau khi khôi phục accessToken
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
