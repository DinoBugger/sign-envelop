import { requestJson } from "./api.js";

const authHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const getMyKeys = (accessToken) => {
  return requestJson("/v1/keys", {
    headers: authHeaders(accessToken),
  });
};

export const generateMyKeyPair = (accessToken) => {
  return requestJson("/v1/keys/generate", {
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const revokeMyKey = (accessToken, keyId) => {
  return requestJson(`/v1/keys/${keyId}/revoke`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
  });
};
