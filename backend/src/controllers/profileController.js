import jwt from "jsonwebtoken";

const ACCESS_AUTH_CONFIG_ERROR = "Server config is missing ACCESS_TOKEN_SECRET. Please set this environment variable.";

export const getProfile = (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) {
    return res.status(500).json({ message: ACCESS_AUTH_CONFIG_ERROR });
  }

  if (!token) {
    return res.status(401).json({ message: "You are not logged in!" });
  }

  return jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Token is invalid or expired!" });
    }

    return res.json({ message: "Welcome to your profile page!", user: decodedUser });
  });
};
