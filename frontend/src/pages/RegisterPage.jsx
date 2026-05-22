import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { validateEmail, validatePassword, validateUsername } from "../utils/validators.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {
      username: validateUsername(form.username),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // Store registration data temporarily in localStorage for OTP verification
      localStorage.setItem(
        "pendingRegistration",
        JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      );

      if (response) {
        navigate("/verify-otp", { replace: true });
      }
    } catch {
      // Toast đã được xử lý ở auth context.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-heading">
        <p className="page-eyebrow">Bắt đầu tại đây</p>
        <h2>Đăng ký</h2>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} autoComplete="off">
        <TextField label="Tên người dùng" name="username" value={form.username} onChange={handleChange} error={errors.username} placeholder="dino.bugger" autoComplete="off" />
        <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" autoComplete="off" />
        <TextField label="Mật khẩu" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} placeholder="Ít nhất 6 ký tự" autoComplete="off" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi mã OTP..." : "Tạo tài khoản"}
        </Button>
      </form>
    </div>
  );
}
