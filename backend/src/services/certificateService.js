import crypto from "crypto";
import Certificate from "../models/Certificate.js";
import User from "../models/User.js";

const PIN_CODE_PATTERN = /^\d{6}$/;
const CERTIFICATE_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000; // Validity in 1 year

const buildEncryptedPrivateKeyBlob = (privateKey, pinCode) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const derivedKey = crypto.scryptSync(pinCode, salt, 32, {
    N: 16384,
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

const buildFingerprint = (publicKey) => {
  return crypto.createHash("sha256").update(publicKey).digest("hex");
};

const buildRawCertificate = (certificateRecord) => {
  const payload = Buffer.from(JSON.stringify(certificateRecord), "utf8").toString("base64");
  const chunks = payload.match(/.{1,64}/g) || [];
  return ["-----BEGIN CERTIFICATE-----", ...chunks, "-----END CERTIFICATE-----"].join("\n");
};

const buildCertSerialNumber = () => {
  return crypto.randomBytes(16).toString("hex");
};

export const generateAndStoreCertificate = async (userId, pinCode) => {
  const existing = await Certificate.findOne({ userId, status: "active" });
  if (existing) {
    const error = new Error("Active certificate already exists");
    error.code = "ACTIVE_CERTIFICATE_EXISTS";
    throw error;
  }

  const normalizedPin = typeof pinCode === "string" ? pinCode.trim() : "";
  if (!PIN_CODE_PATTERN.test(normalizedPin)) {
    const error = new Error("PIN code must be exactly 6 digits");
    error.code = "INVALID_PIN_CODE";
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User does not exist");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const fingerprint = buildFingerprint(publicKey);
  const certSerialNumber = buildCertSerialNumber();
  const validFrom = new Date();
  const validUntil = new Date(Date.now() + CERTIFICATE_VALIDITY_MS);

  const rawCertificate = buildRawCertificate({
    subjectName: user.username,
    subjectEmail: user.email,
    subjectCountry: "VN",
    subjectProvince: user.province || "",
    userSerialNumber: user.serial_number,
    issuerName: "Your Non-Profit CA",
    algorithm: "RSA",
    keySize: 2048,
    keyType: "spki",
    publicKey,
    fingerprint,
    certSerialNumber,
    signatureAlgorithm: "SHA256withRSA",
    validFrom: validFrom.toISOString(),
    validUntil: validUntil.toISOString(),
    status: "active",
  });

  const record = await Certificate.create({
    userId,
    subjectName: user.username,
    subjectEmail: user.email,
    subjectCountry: "VN",
    subjectProvince: user.province || undefined,
    userSerialNumber: user.serial_number,
    issuerName: "Your Non-Profit CA",
    algorithm: "RSA",
    keySize: 2048,
    keyType: "spki",
    publicKey,
    fingerprint,
    certSerialNumber,
    signatureAlgorithm: "SHA256withRSA",
    rawCertificate,
    validFrom,
    validUntil,
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

export const getActiveCertificate = async (userId) => {
  return Certificate.findOne({ userId, status: "active" }).lean();
};

export const getAllCertificates = async (userId) => {
  return Certificate.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getCertificateById = async (userId, id) => {
  const certificate = await Certificate.findById(id).lean();
  if (!certificate) {
    return null;
  }

  if (certificate.userId.toString() !== userId.toString()) {
    return false;
  }

  return certificate;
};

export const revokeCertificateById = async (userId, id) => {
  const certificate = await Certificate.findById(id);
  if (!certificate) return null;
  if (certificate.userId.toString() !== userId.toString()) return false;

  certificate.status = "revoked";
  certificate.revokedAt = new Date();
  await certificate.save();
  return certificate;
};
