const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateUsername = (username) => {
  const normalizedUsername = typeof username === "string" ? username.trim() : "";

  if (!normalizedUsername) {
    return "Username cannot be empty.";
  }

  if (normalizedUsername.length < 3) {
    return "Username must be at least 3 characters.";
  }

  if (normalizedUsername.length > 50) {
    return "Username must not exceed 50 characters.";
  }

  return "";
};

export const validateEmail = (email) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return "Email cannot be empty.";
  }

  if (!emailPattern.test(normalizedEmail)) {
    return "Email format is invalid.";
  }

  if (normalizedEmail.length > 254) {
    return "Email must not exceed 254 characters.";
  }

  return "";
};

export const validatePassword = (password) => {
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!normalizedPassword.trim()) {
    return "Password cannot be empty.";
  }

  if (normalizedPassword.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (normalizedPassword.length > 128) {
    return "Password must not exceed 128 characters.";
  }

  return "";
};
