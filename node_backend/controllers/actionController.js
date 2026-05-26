import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import redis from "../redis/redisClient.js";
import { restartDeployment, scaleDeployment } from "../utils/k8s.js";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

// Create a new action for an incident
export const createAction = async (req, res, next) => {
  try {
    const { incidentId, commandRun, result } = req.body;
    const performedBy = req.user.userId;

    if (!incidentId || !commandRun) {
      throw new ApiError(400, "IncidentId and commandRun are required");
    }

    // Check if incident exists
    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) {
      throw new ApiError(404, "Incident not found");
    }

    const action = await prisma.action.create({
      data: {
        incidentId,
        performedBy,
        commandRun,
        result: result || null,
      },
      include: {
        incident: {
          include: {
            service: true
          }
        }
      }
    });

    return res
      .status(201)
      .json(new ApiResponse(201, action, "Action created successfully"));
  } catch (error) {
    next(error);
  }
};

// Get all actions
export const getAllActions = async (req, res, next) => {
  try {
    const { incidentId, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (incidentId) where.incidentId = incidentId;

    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          incident: {
            include: {
              service: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.action.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, { 
        actions, 
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Actions fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Get action by ID
export const getActionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        incident: {
          include: {
            service: true,
            reportedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!action) {
      throw new ApiError(404, "Action not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, action, "Action fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Update action
export const updateAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commandRun, result } = req.body;

    const existingAction = await prisma.action.findUnique({ where: { id } });
    if (!existingAction) {
      throw new ApiError(404, "Action not found");
    }

    const updateData = {};
    if (commandRun) updateData.commandRun = commandRun;
    if (result !== undefined) updateData.result = result;

    const action = await prisma.action.update({
      where: { id },
      data: updateData,
      include: {
        incident: {
          include: {
            service: true
          }
        }
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, action, "Action updated successfully"));
  } catch (error) {
    next(error);
  }
};

// Delete action
export const deleteAction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingAction = await prisma.action.findUnique({ where: { id } });
    if (!existingAction) {
      throw new ApiError(404, "Action not found");
    }

    await prisma.action.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Action deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// Get actions by incident
export const getActionsByIncident = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if incident exists
    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) {
      throw new ApiError(404, "Incident not found");
    }

    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where: { incidentId },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          incident: {
            include: {
              service: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.action.count({ where: { incidentId } })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        actions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Incident actions fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Get actions by user
export const getActionsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where: { performedBy: userId },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          incident: {
            include: {
              service: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.action.count({ where: { performedBy: userId } })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        actions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "User actions fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Execute an action using Kubernetes
export const executeAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch action with incident and service
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        incident: {
          include: { service: true }
        }
      }
    });

    if (!action) {
      throw new ApiError(404, "Action not found");
    }

    if (!action.commandRun) {
      throw new ApiError(400, "Action does not have an executable command");
    }

    // 2. Parse command (e.g., "restart", "scale 3")
    const commandRegex = action.commandRun.trim().split(/\s+/);
    const intent = commandRegex[0].toLowerCase();
    
    const serviceName = action.incident?.service?.name;
    if (!serviceName) {
      throw new ApiError(400, "Incident is missing an associated service to operate on.");
    }
    
    // For local dev, we assume namespace "default". We could fetch from service meta.
    const namespace = process.env.K8S_NAMESPACE || "devops-platform";
    let output = "";
    
    try {
      if (intent === "restart") {
        output = await restartDeployment(namespace, serviceName);
      } else if (intent === "scale" && commandRegex[1]) {
        const replicas = parseInt(commandRegex[1], 10);
        output = await scaleDeployment(namespace, serviceName, replicas);
      } else {
        throw new Error(`Unsupported Kubernetes action intent: ${intent}`);
      }

      // 3. Mark success
      const updatedAction = await prisma.action.update({
        where: { id },
        data: {
          result: "SUCCESS: " + output.substring(0, 200),
          timestamp: new Date()
        }
      });

      return res.status(200).json(new ApiResponse(200, { action: updatedAction, output }, "Action executed on Kubernetes successfully"));
    } catch (k8sError) {
      // 4. Mark failure
      output = `ERROR: ${k8sError.message}`;
      const updatedAction = await prisma.action.update({
        where: { id },
        data: {
          result: "FAILED: " + output.substring(0, 200),
          timestamp: new Date()
        }
      });
      return res.status(500).json(new ApiResponse(500, { action: updatedAction, output }, "Failed to execute action on Kubernetes"));
    }
  } catch (error) {
    next(error);
  }
};
