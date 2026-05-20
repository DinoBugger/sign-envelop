import jwt from "jsonwebtoken";
import { ACCESS_AUTH_CONFIG_ERROR, accessTokenSecret } from "../config/auth.js";


const resolveAuthenticatedUser = (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const secret = accessTokenSecret;

  if (!secret) {
    res.status(500).json({ message: ACCESS_AUTH_CONFIG_ERROR });
    return null;
  }

  if (!token) {
    res.status(401).json({ message: "You are not logged in!" });
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch {
    res.status(403).json({ message: "Token is invalid or expired!" });
    return null;
  }
};

export const getProfile = (req, res) => {
  const decodedUser = resolveAuthenticatedUser(req, res);
  if (!decodedUser) {
    return;
  }

  return res.json({ message: "Welcome to your profile page!", user: decodedUser });
};
