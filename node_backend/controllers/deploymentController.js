import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new deployment
export const createDeployment = async (req, res, next) => {
  try {
    const { serviceId, version, status } = req.body;
    const deployedById = req.user.userId;

    if (!serviceId || !version) {
      throw new ApiError(400, "ServiceId and version are required");
    }

    // Check if service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    const deployment = await prisma.deployment.create({
      data: {
        serviceId,
        version,
        status: status || "SUCCESS",
        deployedById,
      },
      include: {
        service: true,
        deployedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res
      .status(201)
      .json(new ApiResponse(201, deployment, "Deployment created successfully"));
  } catch (error) {
    next(error);
  }
};

// Get all deployments
export const getAllDeployments = async (req, res, next) => {
  try {
    const { serviceId, status, deployedById, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (serviceId) where.serviceId = serviceId;
    if (status) where.status = status;
    if (deployedById) where.deployedById = deployedById;

    const skip = (page - 1) * limit;

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true,
          deployedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { deployedAt: 'desc' }
      }),
      prisma.deployment.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, { 
        deployments, 
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Deployments fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Get deployment by ID
export const getDeploymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        deployedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!deployment) {
      throw new ApiError(404, "Deployment not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deployment, "Deployment fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Update deployment
export const updateDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { version, status } = req.body;

    const existingDeployment = await prisma.deployment.findUnique({ where: { id } });
    if (!existingDeployment) {
      throw new ApiError(404, "Deployment not found");
    }

    const updateData = {};
    if (version) updateData.version = version;
    if (status) {
      updateData.status = status;
      if (status === "ROLLED_BACK") {
        updateData.rolledBackAt = new Date();
      }
    }

    const deployment = await prisma.deployment.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        deployedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, deployment, "Deployment updated successfully"));
  } catch (error) {
    next(error);
  }
};

// Delete deployment
export const deleteDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingDeployment = await prisma.deployment.findUnique({ where: { id } });
    if (!existingDeployment) {
      throw new ApiError(404, "Deployment not found");
    }

    await prisma.deployment.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Deployment deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// Get deployments by service
export const getDeploymentsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    const where = { serviceId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true,
          deployedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { deployedAt: 'desc' }
      }),
      prisma.deployment.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        deployments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Service deployments fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Get deployments by user
export const getDeploymentsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { deployedById: userId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true,
          deployedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { deployedAt: 'desc' }
      }),
      prisma.deployment.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        deployments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "User deployments fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Rollback deployment
export const rollbackDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingDeployment = await prisma.deployment.findUnique({ where: { id } });
    if (!existingDeployment) {
      throw new ApiError(404, "Deployment not found");
    }

    if (existingDeployment.status === "ROLLED_BACK") {
      throw new ApiError(400, "Deployment is already rolled back");
    }

    const deployment = await prisma.deployment.update({
      where: { id },
      data: {
        status: "ROLLED_BACK",
        rolledBackAt: new Date(),
      },
      include: {
        service: true,
        deployedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, deployment, "Deployment rolled back successfully"));
  } catch (error) {
    next(error);
  }
};

// Get deployment statistics
export const getDeploymentStats = async (req, res, next) => {
  try {
    const { serviceId, startDate, endDate } = req.query;

    const where = {};
    if (serviceId) where.serviceId = serviceId;
    if (startDate || endDate) {
      where.deployedAt = {};
      if (startDate) where.deployedAt.gte = new Date(startDate);
      if (endDate) where.deployedAt.lte = new Date(endDate);
    }

    const [
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      rolledBackDeployments,
      recentDeployments
    ] = await Promise.all([
      prisma.deployment.count({ where }),
      prisma.deployment.count({ where: { ...where, status: "SUCCESS" } }),
      prisma.deployment.count({ where: { ...where, status: "FAILED" } }),
      prisma.deployment.count({ where: { ...where, status: "ROLLED_BACK" } }),
      prisma.deployment.findMany({
        where,
        take: 10,
        orderBy: { deployedAt: 'desc' },
        include: {
          service: true,
          deployedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);

    const stats = {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      rolledBackDeployments,
      successRate: totalDeployments > 0 ? (successfulDeployments / totalDeployments * 100).toFixed(2) : 0,
      recentDeployments
    };

    return res
      .status(200)
      .json(new ApiResponse(200, stats, "Deployment statistics fetched successfully"));
  } catch (error) {
    next(error);
  }
};