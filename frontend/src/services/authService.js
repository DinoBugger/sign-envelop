import { requestJson } from "./api.js";

export const registerUser = (payload) => {
  return requestJson("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const loginUser = (payload) => {
  return requestJson("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const refreshAccessToken = () => {
  return requestJson("/auth/refresh", {
    method: "POST",
  });
};

export const logoutUser = () => {
  return requestJson("/auth/logout", {
    method: "POST",
  });
};
