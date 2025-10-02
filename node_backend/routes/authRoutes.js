import { Router } from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  refresh
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const authRoutes = Router();

// Public routes
authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refresh);

// Protected routes
authRoutes.post("/logout", authenticate, logout);
authRoutes.get("/me", authenticate, getCurrentUser);

export default authRoutes;