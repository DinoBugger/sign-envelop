const DEFAULT_BASE_URL = "http://localhost:8080";

const getBaseUrl = () => {
  return (import.meta.env.VITE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
};

const getApiBaseUrl = () => {
  return `${getBaseUrl()}/api`;
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
