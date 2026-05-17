import mongoose from "mongoose";
import { getTrimmedEnv } from "../utils/env.js";

const connectDb = async () => {
  try {
    await mongoose.connect(getTrimmedEnv("MONGO_URI"), { dbName: "digi-sign_system" });
    console.log("Kết nối đến MongoDB thành công");
  } catch (error) {
    console.error("Lỗi kết nối MongoDB", error);
    process.exit(1);
  }
};

export default connectDb;
