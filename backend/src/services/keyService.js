import crypto from "crypto";
import RSAPublicKey from "../models/RSAPublicKey.js";

export const generateAndStoreKey = async (userId) => {
  // Check if any current active public key, if exists revoke it
  const existing = await RSAPublicKey.findOne({ userId, status: "active" });
  if (existing) {
    existing.status = "revoked";
    existing.revokedAt = new Date();
    await existing.save();
  }

  // generate sync pair of keys
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  // create a hashing version of public key which is shorter considerably
  const fingerprint = crypto.createHash("sha256").update(publicKey).digest("hex");

  const record = await RSAPublicKey.create({
    userId,
    algorithm: "RSA",
    keyType: "spki",
    publicKey,
    fingerprint,
    status: "active",
  });

  return { publicKey, privateKey, record };
};

export const getActiveKey = async (userId) => {
  return RSAPublicKey.findOne({ userId, status: "active" }).lean();
};

export const getAllKeys = async (userId) => {
  return RSAPublicKey.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const revokeKeyById = async (userId, id) => {
  const key = await RSAPublicKey.findById(id);
  if (!key) return null;
  if (key.userId.toString() !== userId.toString()) return false;

  key.status = "revoked";
  key.revokedAt = new Date();
  await key.save();
  return key;
};
