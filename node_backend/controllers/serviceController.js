import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import redis from "../redis/redisClient.js";
import { isRateLimited, getIdentifier } from "../middlewares/rateLimiter.js";

// Create a new service
export const createService = async (req, res, next) => {
  try {
    const identifier = getIdentifier(req);
    
    // Check rate limit
    const limited = await isRateLimited(identifier, 'crud');
    if (limited) {
      throw new ApiError(429, "Too many service creation attempts. Try again later.");
    }

    const { name, status, metrics } = req.body;
    const ownerId = req.user.userId;

    if (!name) {
      throw new ApiError(400, "Service name is required");
    }

    // Check if service with same name already exists
    const existingService = await prisma.service.findFirst({ 
      where: { name } 
    });
    if (existingService) {
      throw new ApiError(409, "Service with this name already exists");
    }

    const service = await prisma.service.create({
      data: {
        name,
        status: status || "HEALTHY",
        metrics: metrics || null,
        ownerId,
        lastChecked: new Date(),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        incidents: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        deployments: {
          take: 5,
          orderBy: { deployedAt: 'desc' }
        }
      }
    });

    // Clear relevant caches
    await redis.del('services:all');
    await redis.del(`services:owner:${ownerId}`);
    await redis.del('services:stats');

    return res
      .status(201)
      .json(new ApiResponse(201, service, "Service created successfully"));
  } catch (error) {
    next(error);
  }
};

// Get all services
export const getAllServices = async (req, res, next) => {
  try {
    const { status, ownerId, page = 1, limit = 10 } = req.query;
    
    // Create cache key
    const cacheKey = `services:all:${page}:${limit}:${status || 'all'}:${ownerId || 'all'}`;
    
    // Check cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res
        .status(200)
        .json(new ApiResponse(200, JSON.parse(cachedData), "Services fetched successfully (cached)"));
    }

    const where = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          incidents: {
            where: { status: { not: "RESOLVED" } },
            take: 3,
            orderBy: { createdAt: 'desc' }
          },
          deployments: {
            take: 3,
            orderBy: { deployedAt: 'desc' }
          },
          _count: {
            select: {
              incidents: true,
              logs: true,
              deployments: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.service.count({ where })
    ]);

    const result = { 
      services, 
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Services fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Get service by ID
export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `service:${id}`;
    const cachedService = await redis.get(cacheKey);
    
    if (cachedService) {
      return res
        .status(200)
        .json(new ApiResponse(200, JSON.parse(cachedService), "Service fetched successfully (cached)"));
    }

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        incidents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            reportedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        logs: {
          take: 20,
          orderBy: { timestamp: 'desc' }
        },
        deployments: {
          take: 10,
          orderBy: { deployedAt: 'desc' },
          include: {
            deployedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            incidents: true,
            logs: true,
            deployments: true
          }
        }
      }
    });

    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(service));

    return res
      .status(200)
      .json(new ApiResponse(200, service, "Service fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Update service
export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status, metrics } = req.body;

    const existingService = await prisma.service.findUnique({ where: { id } });
    if (!existingService) {
      throw new ApiError(404, "Service not found");
    }

    // Check if updating name and name already exists
    if (name && name !== existingService.name) {
      const nameExists = await prisma.service.findFirst({ 
        where: { name, id: { not: id } } 
      });
      if (nameExists) {
        throw new ApiError(409, "Service with this name already exists");
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (metrics !== undefined) updateData.metrics = metrics;
    updateData.lastChecked = new Date();

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        incidents: {
          where: { status: { not: "RESOLVED" } },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        deployments: {
          take: 5,
          orderBy: { deployedAt: 'desc' }
        }
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, service, "Service updated successfully"));
  } catch (error) {
    next(error);
  }
};

// Delete service
export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingService = await prisma.service.findUnique({ where: { id } });
    if (!existingService) {
      throw new ApiError(404, "Service not found");
    }

    // Delete all related records first
    await prisma.$transaction(async (tx) => {
      // Delete actions related to incidents of this service
      await tx.action.deleteMany({
        where: {
          incident: {
            serviceId: id
          }
        }
      });

      // Delete incidents
      await tx.incident.deleteMany({ where: { serviceId: id } });

      // Delete logs
      await tx.log.deleteMany({ where: { serviceId: id } });

      // Delete deployments
      await tx.deployment.deleteMany({ where: { serviceId: id } });

      // Delete service
      await tx.service.delete({ where: { id } });
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Service deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// Get services by owner
export const getServicesByOwner = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { ownerId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          incidents: {
            where: { status: { not: "RESOLVED" } },
            take: 3,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              incidents: true,
              logs: true,
              deployments: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.service.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        services,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Owner services fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Update service health status
export const updateServiceHealth = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, metrics } = req.body;

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const existingService = await prisma.service.findUnique({ where: { id } });
    if (!existingService) {
      throw new ApiError(404, "Service not found");
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        status,
        metrics: metrics || existingService.metrics,
        lastChecked: new Date(),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, service, "Service health updated successfully"));
  } catch (error) {
    next(error);
  }
};