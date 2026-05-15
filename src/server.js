import mainRouter from "./routers/index.js";

import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/database.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(mainRouter);
const SECRET_KEY = process.env.JWT_SECRET;

app.get("/api/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Bạn chưa đăng nhập!" });

  jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
    if (err) return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });

    res.json({ message: "Chào mừng bạn đến với trang cá nhân!", user: decodedUser });
  });
});

connectDb().then(() => {
  app.listen(port, () => console.log(`Server is listening at localhost:${port}`));
});
