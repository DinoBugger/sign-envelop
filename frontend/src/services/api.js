const DEFAULT_API_BASE_URL = "/api";

const getApiBaseUrl = () => {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
};

const safeParseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const requestJson = async (path, options = {}) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
};
