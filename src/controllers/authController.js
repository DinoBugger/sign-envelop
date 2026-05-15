import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công!", user: { id: newUser._id, username: newUser.username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Hàm xử lý Đăng nhập
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ message: "Đăng nhập thành công!", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
