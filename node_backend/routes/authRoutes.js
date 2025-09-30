import { Router } from "express";
import {
  register,
  login,
  logout,
  getCurrentUser
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const authRoutes = Router();

// Authentication routes
authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", verifyToken, getCurrentUser);

export default authRoutes;