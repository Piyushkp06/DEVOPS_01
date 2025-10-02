import { Router } from "express";
import {
  createAction,
  getAllActions,
  getActionById,
  updateAction,
  deleteAction,
  getActionsByIncident,
  getActionsByUser
} from "../controllers/actionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const actionRoutes = Router();

// All action routes require authentication
actionRoutes.use(authenticate);

// Action CRUD routes
actionRoutes.post("/", createAction);
actionRoutes.get("/", getAllActions);
actionRoutes.get("/:id", getActionById);
actionRoutes.put("/:id", updateAction);
actionRoutes.delete("/:id", deleteAction);

// Incident-specific action routes
actionRoutes.get("/incident/:incidentId", getActionsByIncident);

// User-specific action routes
actionRoutes.get("/user/:userId", getActionsByUser);

export default actionRoutes;