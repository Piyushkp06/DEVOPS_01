import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    console.log("JWT cookie not found");
    return res.status(401).send("You are not authenticated!");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.log("JWT verification failed", err);
      return res.status(403).send("Token is not valid!");
    }

    // Attach IDs for compatibility
    req.user = {
      id: payload.id,
      role: payload.role,
    };

    next();
  });
};

// ✅ Role-based check
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Forbidden: insufficient permissions");
    }
    next();
  };
};
