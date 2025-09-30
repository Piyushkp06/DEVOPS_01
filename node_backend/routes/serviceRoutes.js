import { Router } from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getServicesByOwner,
  updateServiceHealth
} from "../controllers/serviceController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const serviceRoutes = Router();

// All service routes require authentication
serviceRoutes.use(verifyToken);

// Service CRUD routes
serviceRoutes.post("/", createService);
serviceRoutes.get("/", getAllServices);
serviceRoutes.get("/:id", getServiceById);
serviceRoutes.put("/:id", updateService);
serviceRoutes.delete("/:id", deleteService);

// Owner-specific service routes
serviceRoutes.get("/owner/:ownerId", getServicesByOwner);

// Service health routes
serviceRoutes.patch("/:id/health", updateServiceHealth);

export default serviceRoutes;