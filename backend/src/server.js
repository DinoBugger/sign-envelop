import fs from "fs";
import mainRouter from "./routers/index.js";

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/database.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/$/, "");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRootDir = path.resolve(__dirname, "../../frontend");
const frontendDistDir = path.resolve(frontendRootDir, "dist");
const frontendIndexFile = path.join(frontendDistDir, "index.html");

const getOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

const allowedOrigins = new Set(
  [getOrigin(baseUrl), `http://localhost:5173`, `http://127.0.0.1:5173`]
    .concat((process.env.CORS_ORIGINS || "").split(","))
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(mainRouter);

if (fs.existsSync(frontendIndexFile)) {
  app.use(express.static(frontendDistDir));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(frontendIndexFile);
  });
}

connectDb().then(() => {
  app.listen(port, () => console.log(`Server is listening at ${baseUrl}`));
});
