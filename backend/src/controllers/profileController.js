import { resolveAuthenticatedUser } from "../utils/auth.js";

export const getProfile = (req, res) => {
  const decodedUser = resolveAuthenticatedUser(req, res);
  if (!decodedUser) {
    return;
  }

  return res.json({ message: "Welcome to your profile page!", user: decodedUser });
};
