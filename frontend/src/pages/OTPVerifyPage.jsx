import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { verifyOTP } from "../services/authService.js";

export default function OTPVerifyPage() {
  const navigate = useNavigate();
  const { setUserMessage } = useAuth();
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  useEffect(() => {
    // Retrieve pending registration data
    const pending = localStorage.getItem("pendingRegistration");
    if (!pending) {
      setUserMessage("Please complete the registration form first.");
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
  }, [navigate, setUserMessage]);

  const handleChange = (event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6); // Only digits, max 6
    setOtpCode(value);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyOTP({
        email: registrationData.email,
        otp_code: otpCode,
        username: registrationData.username,
        password: registrationData.password,
      });

      // Clear pending registration data
      localStorage.removeItem("pendingRegistration");

      setUserMessage(response.message || "Registration successful! Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationData) {
    return (
      <div className="page-card">
        <p>Loading...</p>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="page-card">
      <div className="page-heading">
        <p className="page-eyebrow">Verification</p>
        <h2>Verify Your Email</h2>
        <p>Enter the 6-digit code sent to {registrationData.email}</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <TextField label="OTP Code" type="text" value={otpCode} onChange={handleChange} error={error} placeholder="000000" maxLength="6" disabled={timeLeft === 0} />

        <div style={{ fontSize: "0.9em", textAlign: "center", color: timeLeft < 30 ? "#e74c3c" : "#666" }}>
          Code expires in: {minutes}:{seconds.toString().padStart(2, "0")}
        </div>

        <Button type="submit" disabled={isSubmitting || timeLeft === 0 || otpCode.length !== 6}>
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </Button>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            Didn't receive the code?{" "}
            <a href="/register" style={{ color: "#0066cc", textDecoration: "none" }}>
              Go back to register
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
