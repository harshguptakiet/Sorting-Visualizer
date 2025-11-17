import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const hdr = req.headers.authorization;
  if (!hdr || !hdr.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = hdr.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
