import jwt from "jsonwebtoken";
import { ACCESS_AUTH_CONFIG_ERROR, accessTokenSecret } from "../config/auth.js";

export const resolveAuthenticatedUser = (req, res, { secret = accessTokenSecret, missingSecretMessage = ACCESS_AUTH_CONFIG_ERROR } = {}) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!secret) {
    res.status(500).json({ message: missingSecretMessage });
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
