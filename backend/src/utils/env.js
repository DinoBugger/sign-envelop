import dotenv from "dotenv";

dotenv.config();

export const getTrimmedEnv = (name, fallback = "") => {
  const value = process.env[name];

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
};
