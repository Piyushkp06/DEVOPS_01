import { Router } from "express";
import {
  createDeployment,
  getAllDeployments,
  getDeploymentById,
  updateDeployment,
  deleteDeployment,
  getDeploymentsByService,
  getDeploymentsByUser,
  rollbackDeployment,
  getDeploymentStats
} from "../controllers/deploymentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const deploymentRoutes = Router();

// All deployment routes require authentication
deploymentRoutes.use(authenticate);

// Deployment CRUD routes
deploymentRoutes.post("/", createDeployment);
deploymentRoutes.get("/", getAllDeployments);
deploymentRoutes.get("/:id", getDeploymentById);
deploymentRoutes.put("/:id", updateDeployment);
deploymentRoutes.delete("/:id", deleteDeployment);

// Service-specific deployment routes
deploymentRoutes.get("/service/:serviceId", getDeploymentsByService);

// User-specific deployment routes
deploymentRoutes.get("/user/:userId", getDeploymentsByUser);

// Deployment action routes
deploymentRoutes.patch("/:id/rollback", rollbackDeployment);

// Deployment statistics
deploymentRoutes.get("/stats/overview", getDeploymentStats);

export default deploymentRoutes;