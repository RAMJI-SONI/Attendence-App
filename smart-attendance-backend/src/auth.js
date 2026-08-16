import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function signUser(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "7d" }
  );
}

export function auth(requiredRole = null) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({message:"Authentication required"});

    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).json({message:"Insufficient permissions"});
      }
      next();
    } catch {
      return res.status(401).json({message:"Invalid or expired token"});
    }
  };
}