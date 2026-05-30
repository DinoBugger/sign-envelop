import { requestJson } from "./api.js";

const authHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const getProfile = (accessToken) => {
  return requestJson("/profile", {
    headers: authHeaders(accessToken),
  });
};

export const updateUsername = (accessToken, username) => {
  return requestJson("/profile/username", {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ username }),
  });
};

export const updateProvince = (accessToken, province) => {
  return requestJson("/profile/province", {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ province }),
  });
};

export const updatePassword = (accessToken, currentPassword, newPassword) => {
  return requestJson("/profile/password", {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};
