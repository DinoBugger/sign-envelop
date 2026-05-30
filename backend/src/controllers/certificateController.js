import { resolveAuthenticatedUser } from "../utils/auth.js";
import * as certificateService from "../services/certificateService.js";

export const generateCertificate = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const { publicKey, encryptedPrivateKeyBase64, privateKeyFileName, record } = await certificateService.generateAndStoreCertificate(decoded.id, req.body?.pin);
    return res.status(201).json({
      message: "Certificate generated",
      data: {
        publicKey,
        encryptedPrivateKeyBase64,
        privateKeyFileName,
        id: record._id,
      },
    });
  } catch (err) {
    if (err?.code === "ACTIVE_CERTIFICATE_EXISTS") {
      return res.status(409).json({ message: "Active certificate already exists. Revoke the current certificate before generating a new one." });
    }

    if (err?.code === "INVALID_PIN_CODE") {
      return res.status(400).json({ message: "PIN code must be exactly 6 digits" });
    }

    console.error(err);
    return res.status(500).json({ message: "Failed to generate certificate" });
  }
};

export const getActiveCertificate = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const certificate = await certificateService.getActiveCertificate(decoded.id);
    if (!certificate) return res.status(404).json({ message: "No active certificate found" });
    return res.json({ data: certificate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch active certificate" });
  }
};

export const getAllCertificates = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const certificates = await certificateService.getAllCertificates(decoded.id);
    return res.json({ data: certificates });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch certificates" });
  }
};

export const getCertificate = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  const { id } = req.params;
  try {
    const certificate = await certificateService.getCertificateById(decoded.id, id);
    if (certificate === null) return res.status(404).json({ message: "Certificate not found" });
    if (certificate === false) return res.status(403).json({ message: "Not authorized to view this certificate" });
    return res.json({ data: certificate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch certificate" });
  }
};

export const revokeCertificate = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  const { id } = req.params;
  try {
    const result = await certificateService.revokeCertificateById(decoded.id, id);
    if (result === null) return res.status(404).json({ message: "Certificate not found" });
    if (result === false) return res.status(403).json({ message: "Not authorized to revoke this certificate" });
    return res.json({ message: "Certificate revoked", data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to revoke certificate" });
  }
};
