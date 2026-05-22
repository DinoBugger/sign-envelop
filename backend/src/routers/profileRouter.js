import express from "express";
import { getProfile, updateUsername, updatePassword } from "../controllers/profileController.js";

const router = express.Router();

router.get("/", getProfile);
router.put("/username", updateUsername);
router.put("/password", updatePassword);

export default router;
