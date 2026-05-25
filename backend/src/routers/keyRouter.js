import express from "express";
import { generateKey, getActive, getAll, revoke } from "../controllers/keyController.js";

const router = express.Router();

// POST /api/v1/keys/generate
router.post("/generate", generateKey);

// GET /api/v1/keys/active
router.get("/active", getActive);

// GET /api/v1/keys
router.get("/", getAll);

// PATCH /api/v1/keys/:id/revoke
router.patch("/:id/revoke", revoke);

export default router;
