import { Router } from "express";
import {
  createLog,
  getAllLogs,
  getLogById,
  updateLog,
  deleteLog,
  getLogsByService,
  bulkCreateLogs,
  deleteLogsByDateRange,
  getLogStats,
  searchLogs
} from "../controllers/logController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const logRoutes = Router();

// All log routes require authentication
logRoutes.use(authenticate);

// Log CRUD routes
logRoutes.post("/", createLog);
logRoutes.get("/", getAllLogs);
logRoutes.get("/:id", getLogById);
logRoutes.put("/:id", updateLog);
logRoutes.delete("/:id", deleteLog);

// Service-specific log routes
logRoutes.get("/service/:serviceId", getLogsByService);

// Bulk operations
logRoutes.post("/bulk", bulkCreateLogs);
logRoutes.delete("/bulk/date-range", deleteLogsByDateRange);

// Log statistics and search
logRoutes.get("/stats/overview", getLogStats);
logRoutes.get("/search/query", searchLogs);

export default logRoutes;