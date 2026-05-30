import { requestJson } from "./api.js";

const authHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const getMyCertificates = (accessToken) => {
  return requestJson("/v1/certificates", {
    headers: authHeaders(accessToken),
  });
};

export const getCertificateById = (accessToken, certificateId) => {
  return requestJson(`/v1/certificates/${certificateId}`, {
    headers: authHeaders(accessToken),
  });
};

export const generateMyCertificate = (accessToken, pin) => {
  return requestJson("/v1/certificates/generate", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ pin }),
  });
};

export const revokeMyCertificate = (accessToken, certificateId) => {
  return requestJson(`/v1/certificates/${certificateId}/revoke`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
  });
};
