import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import OTP from "../models/OTP.js";
import { sendWelcomeEmail, sendOtpEmail } from "../services/mailerService.js";
import { ACCESS_AUTH_CONFIG_ERROR, REFRESH_AUTH_CONFIG_ERROR, accessTokenSecret, refreshTokenSecret } from "../config/auth.js";
import { isKnownProvince } from "../constants/provinces.js";
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // REFRESH TIME TO LIVE
const REFRESH_COOKIE_NAME = "refreshToken";
const isProduction = "";
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

const validateEmail = (email) => {
  if (typeof email !== "string") {
    return "Email must be a string.";
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return "Email cannot be empty.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return "Email format is invalid.";
  }

  if (normalizedEmail.length > 254) {
    return "Email must not exceed 254 characters.";
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

const validateProvince = (province) => {
  if (province === undefined || province === null || province === "") {
    return null;
  }

  if (typeof province !== "string") {
    return "Province must be a string.";
  }

  const normalizedProvince = province.trim();

  if (!normalizedProvince) {
    return null;
  }

  if (!isKnownProvince(normalizedProvince)) {
    return "Province is not a recognized province.";
  }

  return null;
};

const getAccessTokenSecret = () => {
  return accessTokenSecret || null;
};

const getRefreshTokenSecret = () => {
  return refreshTokenSecret || null;
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((accumulator, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) {
      return accumulator;
    }

    accumulator[rawKey] = decodeURIComponent(rawValue.join("="));
    return accumulator;
  }, {});
};

const getRefreshTokenFromCookie = (req) => {
  const cookies = parseCookieHeader(req.headers.cookie || "");
  return cookies[REFRESH_COOKIE_NAME] || "";
};

const setRefreshTokenCookie = (res, refreshToken) => {
  //cookie(key, value, options)
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
  });
};

// sign parameters: (Payload, Secret, Options)

const signAccessToken = (user, accessSecret) => {
  return jwt.sign({ id: user._id, username: user.username, email: user.email, province: user.province }, accessSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

const signRefreshToken = (user, refreshSecret, jti) => {
  return jwt.sign({ sub: user._id.toString(), jti }, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

const issueTokenPair = async (user, accessSecret, refreshSecret) => {
  // This issue 2 tokens after storing the refresh token to mongodb
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken(user, accessSecret);
  const refreshToken = signRefreshToken(user, refreshSecret, jti);

  await RefreshToken.create({
    userId: user._id,
    jti,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const hashCertificateSerial = (email) => {
  return crypto.createHash("sha256").update(email).digest("hex");
};

export const register = async (req, res) => {
  try {
    const { username, email, password, province } = req.body;

    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ message: usernameError });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const provinceError = validateProvince(province);
    if (provinceError) {
      return res.status(400).json({ message: provinceError });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedProvince = typeof province === "string" ? province.trim() : "";
    const certificateSerial = hashCertificateSerial(normalizedEmail);

    const userExists = await User.findOne({ username: normalizedUsername });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists!" });
    }

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    // Generate OTP
    const otpCode = generateOTP();

    // Delete any existing pending OTP for this email
    await OTP.deleteMany({ email: normalizedEmail, status: "PENDING", action_type: "REGISTER" });

    // Create new OTP record
    await OTP.create({
      email: normalizedEmail,
      otp_code: otpCode,
      action_type: "REGISTER",
      status: "PENDING",
    });

    // Send OTP email
    await sendOtpEmail({ email: normalizedEmail, otpCode, actionType: "REGISTER" });

    // Return response with info to store in frontend (password will be hashed later)
    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        province: normalizedProvince || undefined,
        certificate_serial: certificateSerial,
        password, // Will be hashed on verification (send it securely)
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error!" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp_code, username, password, province } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({ message: "Email and OTP code are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if OTP exists and is valid
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      otp_code: otp_code.toString(),
      action_type: "REGISTER",
      status: "PENDING",
    });

    if (!otpRecord) {
      // Increment attempts count if record exists
      const existingOTP = await OTP.findOne({ email: normalizedEmail, action_type: "REGISTER" });
      if (existingOTP) {
        existingOTP.attempts_count += 1;
        await existingOTP.save();
      }
      return res.status(400).json({ message: "Invalid OTP code." });
    }

    // Check max attempts
    if (otpRecord.attempts_count >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Too many attempts. Please request a new OTP." });
    }

    const provinceError = validateProvince(province);
    if (provinceError) {
      return res.status(400).json({ message: provinceError });
    }

    const normalizedProvince = typeof province === "string" ? province.trim() : "";
    const certificateSerial = hashCertificateSerial(normalizedEmail);

    // Mark OTP as used
    otpRecord.status = "USED";
    await otpRecord.save();

    // Create user account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: username.trim(),
      email: normalizedEmail,
      certificate_serial: certificateSerial,
      province: normalizedProvince || undefined,
      password: hashedPassword,
    });
    await newUser.save();

    // Send welcome email
    void sendWelcomeEmail(newUser).catch((error) => {
      console.warn("Welcome email failed:", error.message);
    });

    res.status(201).json({
      message: "Registration successful!",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        certificate_serial: newUser.certificate_serial,
        province: newUser.province,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error!" });
  }
};

// Hàm xử lý Đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const secret = getAccessTokenSecret();
    if (!secret) {
      return res.status(500).json({ message: ACCESS_AUTH_CONFIG_ERROR });
    }

    const refreshSecret = getRefreshTokenSecret();
    if (!refreshSecret) {
      return res.status(500).json({ message: REFRESH_AUTH_CONFIG_ERROR });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, secret, refreshSecret);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: "Login successful!",
      accessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error!" });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      return res.status(400).json({ message: "refreshToken is required." });
    }

    const accessSecret = getAccessTokenSecret();
    if (!accessSecret) {
      return res.status(500).json({ message: ACCESS_AUTH_CONFIG_ERROR });
    }

    const refreshSecret = getRefreshTokenSecret();
    if (!refreshSecret) {
      return res.status(500).json({ message: REFRESH_AUTH_CONFIG_ERROR });
    }
    // ================= VERIFICATION

    // Stage 1: use secret in server to verify
    let decoded = null;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ message: "Refresh token is invalid or expired." });
    }

    // Stage 2: check payload
    if (!decoded?.sub || !decoded?.jti) {
      return res.status(401).json({ message: "Refresh token is invalid." });
    }

    // Comparing submitted token with the one saved in db, if is invalid, revoke it immediately
    const storedToken = await RefreshToken.findOne({
      userId: decoded.sub,
      jti: decoded.jti,
      revokedAt: null,
    });

    // Check existence
    if (!storedToken) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ message: "Refresh token has been revoked or does not exist." });
    }

    // Check expiration
    if (storedToken.expiresAt.getTime() <= Date.now()) {
      storedToken.revokedAt = new Date();
      await storedToken.save();
      clearRefreshTokenCookie(res);
      return res.status(401).json({ message: "Refresh token has expired." });
    }

    // check token hash
    if (storedToken.tokenHash !== hashToken(refreshToken)) {
      storedToken.revokedAt = new Date();
      await storedToken.save();
      clearRefreshTokenCookie(res);
      return res.status(401).json({ message: "Refresh token is invalid." });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      storedToken.revokedAt = new Date();
      await storedToken.save();
      clearRefreshTokenCookie(res);
      return res.status(401).json({ message: "User does not exist." });
    }

    // Rotate refresh token: revoke the old one and renew
    storedToken.revokedAt = new Date();
    await storedToken.save();

    const nextTokens = await issueTokenPair(user, accessSecret, refreshSecret);
    setRefreshTokenCookie(res, nextTokens.refreshToken);

    return res.json({
      message: "Token refreshed successfully.",
      accessToken: nextTokens.accessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error!" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      clearRefreshTokenCookie(res);
      return res.status(200).json({ message: "Logout successful." });
    }

    const refreshSecret = getRefreshTokenSecret();
    if (!refreshSecret) {
      return res.status(500).json({ message: REFRESH_AUTH_CONFIG_ERROR });
    }

    let decoded = null;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch {
      clearRefreshTokenCookie(res);
      return res.status(200).json({ message: "Logout successful." });
    }

    if (!decoded?.sub || !decoded?.jti) {
      clearRefreshTokenCookie(res);
      return res.status(200).json({ message: "Logout successful." });
    }

    await RefreshToken.updateOne({ userId: decoded.sub, jti: decoded.jti, revokedAt: null }, { $set: { revokedAt: new Date() } });

    clearRefreshTokenCookie(res);

    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error!" });
  }
};
