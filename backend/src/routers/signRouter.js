import express from "express";
import multer from "multer";
import { signPdfDocument } from "../controllers/signController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

// POST /api/v1/sign
router.post(
  "/",
  upload.fields([
    { name: "documentFile", maxCount: 1 },
    { name: "privateKeyFile", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
    { name: "bin", maxCount: 1 },
  ]),
  signPdfDocument,
);

export default router;
