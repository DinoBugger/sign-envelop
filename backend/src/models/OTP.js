const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  otp_code: {
    type: String,
    required: true,
  },
  action_type: {
    type: String,
    required: true,
    enum: ["REGISTER", "RESET_PASSWORD"],
    default: "REGISTER",
  },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "USED"],
    default: "PENDING",
  },
  attempts_count: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180, // Auto delete each 180 seconds.
  },
});

// Tạo index compound để tìm kiếm nhanh hơn theo email và loại hành động
OTPSchema.index({ email: 1, action_type: 1 });

module.exports = mongoose.model("OTP", OTPSchema);
