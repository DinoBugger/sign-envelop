import { resolveAuthenticatedUser } from "../utils/auth.js";
import * as keyService from "../services/keyService.js";

export const generateKey = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const { publicKey, privateKey, record } = await keyService.generateAndStoreKey(decoded.id);
    return res.status(201).json({ message: "Key generated", data: { publicKey, privateKey, id: record._id } });
  } catch (err) {
    if (err?.code === "ACTIVE_KEY_EXISTS") {
      return res.status(409).json({ message: "Active key already exists. Revoke the current key before generating a new one." });
    }

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
