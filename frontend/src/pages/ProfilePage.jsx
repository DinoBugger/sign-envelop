import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button.jsx";
import TextField from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useProvinces } from "../hooks/useProvinces.js";
import { getProfile, updatePassword, updateProvince, updateUsername } from "../services/profileService.js";
import { logger } from "../utils/logger.js";

const translateError = (message) => {
  const translations = {
    "Username already exists!": "Tên người dùng đã tồn tại.",
    "Username must be at least 3 characters.": "Tên người dùng phải có ít nhất 3 ký tự.",
    "Username must not exceed 50 characters.": "Tên người dùng không được vượt quá 50 ký tự.",
    "Username cannot be empty.": "Tên người dùng không được để trống.",
    "Current password is incorrect.": "Mật khẩu hiện tại không chính xác.",
    "New password must be different from current password.": "Mật khẩu mới phải khác mật khẩu hiện tại.",
    "Password must be at least 6 characters.": "Mật khẩu phải có ít nhất 6 ký tự.",
    "Password must not exceed 128 characters.": "Mật khẩu không được vượt quá 128 ký tự.",
    "Current password and new password are required.": "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.",
    "Province cannot be empty.": "Tỉnh / thành phố không được để trống.",
    "Province must be a string.": "Tỉnh / thành phố không hợp lệ.",
    "Province is not a recognized province.": "Tỉnh / thành phố không có trong danh sách.",
    "Province updated successfully!": "Cập nhật tỉnh / thành phố thành công!",
    "User does not exist.": "Tài khoản không tồn tại.",
    "Server error!": "Đã xảy ra lỗi máy chủ.",
    "Username updated successfully!": "Cập nhật tên người dùng thành công!",
    "Password updated successfully!": "Cập nhật mật khẩu thành công!",
  };

  return translations[message] || message;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { provinces } = useProvinces();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingProvince, setEditingProvince] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [usernameForm, setUsernameForm] = useState("");
  const [provinceForm, setProvinceForm] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    fetchProfile();
  }, [accessToken, navigate]);

  const fetchProfile = async () => {
    try {
      const data = await getProfile(accessToken);
      setProfileData(data.user);
      setUsernameForm(data.user.username);
      setProvinceForm(data.user.province || "");
    } catch (error) {
      toast.error("Không thể tải thông tin hồ sơ.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!usernameForm.trim()) {
      nextErrors.username = "Tên người dùng không được để trống.";
    } else if (usernameForm.length < 3) {
      nextErrors.username = "Tên người dùng phải có ít nhất 3 ký tự.";
    } else if (usernameForm.length > 50) {
      nextErrors.username = "Tên người dùng không được vượt quá 50 ký tự.";
    }

    if (usernameForm === profileData.username) {
      nextErrors.username = "Tên người dùng mới phải khác tên hiện tại.";
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await updateUsername(accessToken, usernameForm);

      setProfileData(data.user);
      setEditingUsername(false);
      toast.success(translateError(data.message));
    } catch (error) {
      const errorMsg = translateError(error.message);
      setErrors({ username: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProvince = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await updateProvince(accessToken, provinceForm);

      setProfileData(data.user);
      setEditingProvince(false);
      toast.success(translateError(data.message));
    } catch (error) {
      const errorMsg = translateError(error.message);
      setErrors({ province: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    }

    if (!passwordForm.newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (passwordForm.newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự.";
    } else if (passwordForm.newPassword.length > 128) {
      nextErrors.newPassword = "Mật khẩu không được vượt quá 128 ký tự.";
    }

    if (!passwordForm.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await updatePassword(accessToken, passwordForm.currentPassword, passwordForm.newPassword);

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setEditingPassword(false);
      setErrors({});
      toast.success(translateError(data.message));
    } catch (error) {
      const errorMsg = translateError(error.message);
      setErrors({ password: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-card">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="page-card">
        <p>Không thể tải thông tin hồ sơ.</p>
      </div>
    );
  }

  return (
    <div className="page-card">
      <div className="page-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p className="page-eyebrow" style={{ fontSize: "30px" }}>
              Hồ sơ cá nhân
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button type="button" onClick={logout}>
              Đăng xuất
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "1rem", fontWeight: "600" }}>Thông tin cá nhân</h3>

        {/* Email (read-only) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Email</label>
          <input
            type="email"
            value={profileData.email}
            disabled
            style={{ width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "#f5f5f5", color: "#666" }}
          />
          <p style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.25rem" }}>Email của bạn không thể thay đổi.</p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Tỉnh / thành phố</label>
          {!editingProvince ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, padding: "0.75rem", backgroundColor: "#f5f5f5", borderRadius: "4px", color: "#333" }}>{profileData.province || "-"}</div>
              <button
                type="button"
                onClick={() => setEditingProvince(true)}
                style={{ color: "#0066cc", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap" }}
              >
                Chỉnh sửa
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProvince} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <TextField
                name="province"
                value={provinceForm}
                onChange={(e) => {
                  setProvinceForm(e.target.value);
                  setErrors({ ...errors, province: "" });
                }}
                error={errors.province}
                placeholder="Gõ để tìm tỉnh / thành phố"
                list="province-options"
                autoComplete="address-level1"
              />
              <datalist id="province-options">
                {provinces.map((province) => (
                  <option key={province.id ?? province.name} value={province.name} />
                ))}
              </datalist>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditingProvince(false)} disabled={isSubmitting}>
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Username */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Tên người dùng</label>
          {!editingUsername ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, padding: "0.75rem", backgroundColor: "#f5f5f5", borderRadius: "4px", color: "#333" }}>{profileData.username}</div>
              <button
                type="button"
                onClick={() => setEditingUsername(true)}
                style={{ color: "#0066cc", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap" }}
              >
                Chỉnh sửa
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateUsername} style={{ display: "flex", gap: "0.5rem" }}>
              <TextField
                name="username"
                value={usernameForm}
                onChange={(e) => {
                  setUsernameForm(e.target.value);
                  setErrors({ ...errors, username: "" });
                }}
                error={errors.username}
                placeholder="Nhập tên người dùng mới"
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditingUsername(false)} disabled={isSubmitting}>
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Fingerprint khóa công khai</label>
          {profileData.publicKeyFingerprint ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="text"
                value={profileData.publicKeyFingerprint}
                disabled
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f5f5f5",
                  color: "#666",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  wordBreak: "break-all",
                }}
              />
              <Link to="/keys" style={{ color: "#0066cc", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap", textDecoration: "none" }}>
                Quản lý khóa
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, minWidth: 0, padding: "0.75rem", backgroundColor: "#f5f5f5", borderRadius: "4px", color: "#999" }}>Chưa tạo khóa công khai</div>
              <Link to="/keys" style={{ color: "#0066cc", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap", textDecoration: "none" }}>
                Quản lý khóa
              </Link>
            </div>
          )}
        </div>
      </div>

      <hr style={{ margin: "2rem 0", border: "none", borderTop: "1px solid #eee" }} />

      {/* Password Section */}
      <div>
        <h3 style={{ fontSize: "1rem", marginBottom: "1rem", fontWeight: "600" }}>Bảo mật</h3>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontWeight: "500", marginBottom: "0.25rem" }}>Mật khẩu</p>
              <p style={{ fontSize: "0.9rem", color: "#666" }}>Thay đổi mật khẩu của bạn để bảo vệ tài khoản.</p>
            </div>
            {!editingPassword && (
              <button
                type="button"
                onClick={() => setEditingPassword(true)}
                style={{ color: "#0066cc", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap" }}
              >
                Thay đổi
              </button>
            )}
          </div>

          {editingPassword && (
            <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <TextField
                label="Mật khẩu hiện tại"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                  setErrors({ ...errors, currentPassword: "" });
                }}
                error={errors.currentPassword}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
              <TextField
                label="Mật khẩu mới"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                  setErrors({ ...errors, newPassword: "" });
                }}
                error={errors.newPassword}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
              />
              <TextField
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                  setErrors({ ...errors, confirmPassword: "" });
                }}
                error={errors.confirmPassword}
                placeholder="Xác nhận mật khẩu mới"
                autoComplete="new-password"
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditingPassword(false)} disabled={isSubmitting}>
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
