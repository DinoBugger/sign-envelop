import jwt from "jsonwebtoken";
import { ACCESS_AUTH_CONFIG_ERROR, accessTokenSecret } from "../config/auth.js";
import * as keyService from "../services/keyService.js";

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

export const generateKey = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const { publicKey, privateKey, record } = await keyService.generateAndStoreKey(decoded.id);
    return res.status(201).json({ message: "Key generated", data: { publicKey, privateKey, id: record._id } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to generate key" });
  }
};

export const getActive = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const key = await keyService.getActiveKey(decoded.id);
    if (!key) return res.status(404).json({ message: "No active key found" });
    return res.json({ data: key });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch active key" });
  }
};

export const getAll = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const keys = await keyService.getAllKeys(decoded.id);
    return res.json({ data: keys });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch keys" });
  }
};

export const revoke = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  const { id } = req.params;
  try {
    const result = await keyService.revokeKeyById(decoded.id, id);
    if (result === null) return res.status(404).json({ message: "Key not found" });
    if (result === false) return res.status(403).json({ message: "Not authorized to revoke this key" });
    return res.json({ message: "Key revoked", data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to revoke key" });
  }
};
