const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateUsername = (username) => {
  const normalizedUsername = typeof username === "string" ? username.trim() : "";

  if (!normalizedUsername) {
    return "Tên người dùng không được để trống.";
  }

  if (normalizedUsername.length < 3) {
    return "Tên người dùng phải có ít nhất 3 ký tự.";
  }

  if (normalizedUsername.length > 50) {
    return "Tên người dùng không được vượt quá 50 ký tự.";
  }

  return "";
};

export const validateEmail = (email) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return "Email không được để trống.";
  }

  if (!emailPattern.test(normalizedEmail)) {
    return "Định dạng email không hợp lệ.";
  }

  if (normalizedEmail.length > 254) {
    return "Email không được vượt quá 254 ký tự.";
  }

  return "";
};

export const validatePassword = (password) => {
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!normalizedPassword.trim()) {
    return "Mật khẩu không được để trống.";
  }

  if (normalizedPassword.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (normalizedPassword.length > 128) {
    return "Mật khẩu không được vượt quá 128 ký tự.";
  }

  return "";
};
