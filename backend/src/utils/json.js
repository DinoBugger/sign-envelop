export const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};
