import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/database.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json()); // đây là một middleware cơ bản dùng để kiểm soát dữ liệu được đưa lên có phải là json hay không, nếu đùng thì có thể chuyển tự động thành dạng object

connectDb().then(() => {
  app.listen(port, () => console.log(`Server is listening at localhost:${port}`));
});
