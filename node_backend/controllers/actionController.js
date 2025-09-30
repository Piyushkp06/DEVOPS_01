import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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