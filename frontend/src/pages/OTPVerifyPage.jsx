import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { verifyOTP } from "../services/authService.js";
import { toast } from "react-toastify";

const translateOtpErrorMessage = (message) => {
  const translations = {
    "Please complete the registration form first.": "Vui lòng hoàn tất biểu mẫu đăng ký trước.",
    "Please enter a valid 6-digit OTP.": "Vui lòng nhập mã OTP hợp lệ gồm 6 chữ số.",
    "Email and OTP code are required.": "Vui lòng nhập email và mã OTP.",
    "Invalid OTP code.": "Mã OTP không hợp lệ.",
    "Too many attempts. Please request a new OTP.": "Bạn đã thử quá nhiều lần. Vui lòng yêu cầu mã OTP mới.",
    "Server error!": "Đã xảy ra lỗi máy chủ.",
  };

  return translations[message] || message || "OTP không hợp lệ. Vui lòng thử lại.";
};

export default function OTPVerifyPage() {
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  useEffect(() => {
    // Retrieve pending registration data
    const pending = localStorage.getItem("pendingRegistration");
    if (!pending) {
      toast.error(translateOtpErrorMessage("Please complete the registration form first."));
      navigate("/register", { replace: true });
      return;
    }

    const data = JSON.parse(pending);
    setRegistrationData(data);

    // Timer for OTP expiration
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleChange = (event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6); // Chỉ cho phép chữ số, tối đa 6 ký tự
    setOtpCode(value);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      setError(translateOtpErrorMessage("Please enter a valid 6-digit OTP."));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyOTP({
        email: registrationData.email,
        otp_code: otpCode,
        username: registrationData.username,
        password: registrationData.password,
        province: registrationData.province,
      });

      // Clear pending registration data
      localStorage.removeItem("pendingRegistration");

      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login", { replace: true });
    } catch (err) {
      const translatedError = translateOtpErrorMessage(err.message);
      toast.error(translatedError);
      setError(translatedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationData) {
    return (
      <div className="page-card">
        <p>Đang tải...</p>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="page-card">
      <div className="page-heading">
        <p className="page-eyebrow">Xác minh</p>
        <h2>Xác minh email của bạn</h2>
        <p>Nhập mã 6 chữ số đã gửi tới {registrationData.email}</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} autoComplete="off">
        <TextField label="Mã OTP" type="text" value={otpCode} onChange={handleChange} error={error} placeholder="000000" maxLength="6" disabled={timeLeft === 0} />

        <div style={{ fontSize: "0.9em", textAlign: "center", color: timeLeft < 30 ? "#e74c3c" : "#666" }}>
          Mã hết hạn sau: {minutes}:{seconds.toString().padStart(2, "0")}
        </div>

        <Button type="submit" disabled={isSubmitting || timeLeft === 0 || otpCode.length !== 6}>
          {isSubmitting ? "Đang xác minh..." : "Xác minh OTP"}
        </Button>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            Chưa nhận được mã?{" "}
            <a href="/register" style={{ color: "#0066cc", textDecoration: "none" }}>
              Quay lại đăng ký
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
