import mainRouter from "./routers/index.js";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDb from "./config/database.js";
import { allowedOrigins, baseUrl, isProduction, port } from "./config/app.js";

const app = express();

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

app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(mainRouter);

connectDb().then(() => {
  app.listen(port, () => console.log(`Server is listening at ${baseUrl}`));
});
