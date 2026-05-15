import express from "express";
// Nhập các hàm logic từ controller
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// Định nghĩa các route và gắn với controller tương ứng
router.post("/register", register);
router.post("/login", login);

export default router;
