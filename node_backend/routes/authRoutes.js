import { Router } from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  refresh
  , oauthGitHub,
  oauthGitHubCallback,
  oauthGoogle,
  oauthGoogleCallback
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const authRoutes = Router();

// Public routes
authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refresh);

// OAuth routes
authRoutes.get('/oauth/github', oauthGitHub);
authRoutes.get('/oauth/github/callback', oauthGitHubCallback);
authRoutes.get('/oauth/google', oauthGoogle);
authRoutes.get('/oauth/google/callback', oauthGoogleCallback);

// Protected routes
authRoutes.post("/logout", authenticate, logout);
authRoutes.get("/me", authenticate, getCurrentUser);

export default authRoutes;