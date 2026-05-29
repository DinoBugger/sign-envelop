export const logger = {
  isDebug: process.env.NODE_ENV !== "production",

  info(message, context = "") {
    if (this.isDebug) console.log(`ℹ️ [INFO] ${message}`, context);
  },

  warn(message, context = "") {
    if (this.isDebug) console.warn(`⚠️ [WARN] ${message}`, context);
  },

  error(message, context = "") {
    if (this.isDebug) {
      console.error(`🚨 [ERROR] ${message}`);
      if (context) console.error(context);
    }
  },
};
