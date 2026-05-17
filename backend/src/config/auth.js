import { getTrimmedEnv } from "../utils/env.js";

export const ACCESS_AUTH_CONFIG_ERROR = "Server config is missing ACCESS_TOKEN_SECRET. Please set this environment variable.";
export const REFRESH_AUTH_CONFIG_ERROR = "Server config is missing REFRESH_TOKEN_SECRET. Please set this environment variable.";

export const accessTokenSecret = getTrimmedEnv("ACCESS_TOKEN_SECRET");
export const refreshTokenSecret = getTrimmedEnv("REFRESH_TOKEN_SECRET");
