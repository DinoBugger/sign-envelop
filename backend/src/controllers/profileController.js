import bcrypt from "bcryptjs";
import User from "../models/User.js";
import RSAPublicKey from "../models/RSAPublicKey.js";
import { resolveAuthenticatedUser } from "../utils/auth.js";

const validateUsername = (username) => {
  if (typeof username !== "string") {
    return "Username must be a string.";
  }

  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return "Username cannot be empty.";
  }

  if (normalizedUsername.length < 3) {
    return "Username must be at least 3 characters.";
  }

  if (normalizedUsername.length > 50) {
    return "Username must not exceed 50 characters.";
  }

  return null;
};

const validatePassword = (password) => {
  if (typeof password !== "string") {
    return "Password must be a string.";
  }

  if (!password.trim()) {
    return "Password cannot be empty.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (password.length > 128) {
    return "Password must not exceed 128 characters.";
  }

  return null;
};

export const getProfile = async (req, res) => {
  try {
    const decodedUser = resolveAuthenticatedUser(req, res);
    if (!decodedUser) {
      return;
    }

    const user = await User.findById(decodedUser.id);
    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }

    const activeKey = await RSAPublicKey.findOne({ userId: user._id, status: "active" });

    return res.json({
      message: "Welcome to your profile page!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKeyFingerprint: activeKey?.fingerprint || null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error!" });
  }
};

export const updateUsername = async (req, res) => {
  try {
    const decodedUser = resolveAuthenticatedUser(req, res);
    if (!decodedUser) {
      return;
    }

    const { username } = req.body;

    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ message: usernameError });
    }

    const normalizedUsername = username.trim();

    const user = await User.findById(decodedUser.id);
    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }

    // Check if new username is already taken by another user
    const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists!" });
    }

    user.username = normalizedUsername;
    await user.save();

    return res.json({
      message: "Username updated successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error!" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const decodedUser = resolveAuthenticatedUser(req, res);
    if (!decodedUser) {
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await User.findById(decodedUser.id);
    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // Check if new password is same as current
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: "New password must be different from current password." });
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error!" });
  }
};
