import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { validateEmail, validatePassword } from "../utils/validators.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login({
        email: form.email,
        password: form.password,
      });

      if (response) {
        navigate("/", { replace: true });
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
        <p className="page-eyebrow">Chào mừng trở lại</p>
        <h2>Đăng nhập</h2>
        <p>Nhập email và mật khẩu để lấy lại phiên đăng nhập.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="ban@example.com" autoComplete="email" />
        <TextField label="Mật khẩu" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} placeholder="••••••••" autoComplete="current-password" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
