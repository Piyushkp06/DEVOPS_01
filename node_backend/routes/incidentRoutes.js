import { Router } from "express";
import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  getIncidentsByService
} from "../controllers/incidentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const incidentRoutes = Router();

// All incident routes require authentication
incidentRoutes.use(authenticate);

// Incident CRUD routes
incidentRoutes.post("/", createIncident);
incidentRoutes.get("/", getAllIncidents);
incidentRoutes.get("/:id", getIncidentById);
incidentRoutes.put("/:id", updateIncident);
incidentRoutes.delete("/:id", deleteIncident);

// Service-specific incident routes
incidentRoutes.get("/service/:serviceId", getIncidentsByService);

export default incidentRoutes;