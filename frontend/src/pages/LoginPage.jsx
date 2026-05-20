import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { validateEmail, validatePassword } from "../utils/validators.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, accessToken } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (accessToken) {
      toast.warning("Vui lòng đăng xuất để sử dụng tài khoản khác");
      navigate("/", { replace: true });
    }
  }, [accessToken, navigate]);

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
      // Toasts are handled in the auth context.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-heading">
        <p className="page-eyebrow">Chào mừng trở lại</p>
        <h2>Đăng nhập</h2>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} autoComplete="off">
        <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" autoComplete="off" />
        <TextField label="Mật khẩu" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} placeholder="••••••••" autoComplete="off" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
