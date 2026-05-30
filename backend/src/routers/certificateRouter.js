import express from "express";
import { generateCertificate, getActiveCertificate, getAllCertificates, getCertificate, revokeCertificate } from "../controllers/certificateController.js";

const router = express.Router();

// POST /api/v1/certificates/generate
router.post("/generate", generateCertificate);

// GET /api/v1/certificates/active
router.get("/active", getActiveCertificate);

// GET /api/v1/certificates
router.get("/", getAllCertificates);

// GET /api/v1/certificates/:id
router.get("/:id", getCertificate);

// PATCH /api/v1/certificates/:id/revoke
router.patch("/:id/revoke", revokeCertificate);

export default router;
