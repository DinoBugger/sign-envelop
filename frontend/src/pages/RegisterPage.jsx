import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { validateEmail, validatePassword, validateUsername } from "../utils/validators.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, setUserMessage } = useAuth();
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

      // TODO: add OTP email delivery and verification page before account creation is finalized.
      setUserMessage(response.message || "Registration successful.");
      navigate("/login", { replace: true });
    } catch (error) {
      setUserMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-heading">
        <p className="page-eyebrow">Start here</p>
        <h2>Register</h2>
        <p>Create an account with username, email, and password.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <TextField label="Username" name="username" value={form.username} onChange={handleChange} error={errors.username} placeholder="dino.bugger" autoComplete="username" />
        <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" autoComplete="email" />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}
