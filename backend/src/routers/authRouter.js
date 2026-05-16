import express from "express";
// Nhập các hàm logic từ controller
import { register, login, refreshAccessToken, logout } from "../controllers/authController.js";

const router = express.Router();

// Định nghĩa các route và gắn với controller tương ứng
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;
