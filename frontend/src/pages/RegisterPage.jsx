import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useProvinces } from "../hooks/useProvinces.js";
import { validateEmail, validatePassword, validateProvince, validateUsername } from "../utils/validators.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { provinces, isLoading: isLoadingProvinces } = useProvinces();
  const [form, setForm] = useState({ username: "", email: "", password: "", province: "" });
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
      province: validateProvince(form.province, provinces),
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
        province: form.province,
      });

      // Store registration data temporarily in localStorage for OTP verification
      localStorage.setItem(
        "pendingRegistration",
        JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          province: form.province,
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
        <TextField
          label="Tỉnh / thành phố"
          name="province"
          value={form.province}
          onChange={handleChange}
          error={errors.province}
          placeholder={isLoadingProvinces ? "Đang tải danh sách..." : "Gõ để tìm tỉnh / thành phố"}
          autoComplete="address-level1"
          list="province-options"
        />
        <datalist id="province-options">
          {provinces.map((province) => (
            <option key={province.id ?? province.name} value={province.name} />
          ))}
        </datalist>
        <TextField label="Mật khẩu" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} placeholder="Ít nhất 6 ký tự" autoComplete="off" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi mã OTP..." : "Tạo tài khoản"}
        </Button>
      </form>
    </div>
  );
}
