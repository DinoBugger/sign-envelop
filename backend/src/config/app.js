import { getTrimmedEnv } from "../utils/env.js";

export const port = Number(getTrimmedEnv("PORT", "8080")) || 8080;
export const baseUrl = getTrimmedEnv("BASE_URL", `http://localhost:${port}`).replace(/\/$/, "");
export const isProduction = getTrimmedEnv("NODE_ENV", "development") === "production";

const getOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

export const allowedOrigins = new Set(
  [getOrigin(baseUrl), "http://localhost:5173", "http://127.0.0.1:5173"]
    .concat(getTrimmedEnv("CORS_ORIGINS", "").split(","))
    .map((origin) => origin.trim())
    .filter(Boolean),
);
