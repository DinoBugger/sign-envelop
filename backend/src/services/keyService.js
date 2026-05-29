import crypto from "crypto";
import RSAPublicKey from "../models/RSAPublicKey.js";

const PIN_CODE_PATTERN = /^\d{6}$/;

const buildEncryptedPrivateKeyBlob = (privateKey, pinCode) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const derivedKey = crypto.scryptSync(pinCode, salt, 32, {
    N: 16384, // prevent brute-force
    r: 8,
    p: 1,
  });
  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);
  const ciphertext = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const header = Buffer.alloc(4 + 1 + 1 + 1 + 1 + 4);
  header.write("NPK1", 0, 4, "ascii");
  header.writeUInt8(1, 4);
  header.writeUInt8(salt.length, 5);
  header.writeUInt8(iv.length, 6);
  header.writeUInt8(authTag.length, 7);
  header.writeUInt32BE(ciphertext.length, 8);

  return Buffer.concat([header, salt, iv, authTag, ciphertext]);
};

export const generateAndStoreKey = async (userId, pinCode) => {
  // Prevent generating a second key while another key is still active.
  const existing = await RSAPublicKey.findOne({ userId, status: "active" });
  if (existing) {
    const error = new Error("Active key already exists");
    error.code = "ACTIVE_KEY_EXISTS";
    throw error;
  }

  const normalizedPin = typeof pinCode === "string" ? pinCode.trim() : "";
  if (!PIN_CODE_PATTERN.test(normalizedPin)) {
    const error = new Error("PIN code must be exactly 6 digits");
    error.code = "INVALID_PIN_CODE";
    throw error;
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

  const privateKeyBlob = buildEncryptedPrivateKeyBlob(privateKey, normalizedPin);

  return {
    publicKey,
    encryptedPrivateKeyBase64: privateKeyBlob.toString("base64"),
    privateKeyFileName: `private-key-${record._id}.bin`,
    record,
  };
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
