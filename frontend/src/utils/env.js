export const getTrimmedEnv = (name, fallback = "") => {
  const value = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[name]) || (typeof process !== "undefined" && process.env ? process.env[name] : undefined);

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
};
