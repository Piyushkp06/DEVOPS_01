import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import redis from "../redis/redisClient.js";
import { isRateLimited, getIdentifier } from "../middlewares/rateLimiter.js";

// Create a new incident
export const createIncident = async (req, res, next) => {
  try {
    const identifier = getIdentifier(req);
    
    // Check rate limit
    const limited = await isRateLimited(identifier, 'incident');
    if (limited) {
      throw new ApiError(429, "Too many incident creation attempts. Try again later.");
    }

    const { title, description, severity, serviceId } = req.body;
    const reportedById = req.user.userId;

    if (!title || !description || !serviceId) {
      throw new ApiError(400, "Title, description, and serviceId are required");
    }

    // Check if service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        severity: severity || "LOW",
        serviceId,
        reportedById,
      },
      include: {
        service: true,
        reportedBy: {
          select: { id: true, name: true, email: true }
        },
        actions: true
      }
    });

    // Clear relevant caches
    await redis.del('incidents:all');
    await redis.del(`incidents:service:${serviceId}`);
    await redis.del('incidents:stats');

    return res
      .status(201)
      .json(new ApiResponse(201, incident, "Incident created successfully"));
  } catch (error) {
    next(error);
  }
};

// Get all incidents
export const getAllIncidents = async (req, res, next) => {
  try {
    const { status, severity, serviceId, page = 1, limit = 10 } = req.query;
    
    // Create cache key based on query parameters
    const cacheKey = `incidents:all:${page}:${limit}:${status || 'all'}:${severity || 'all'}:${serviceId || 'all'}`;
    
    // Check cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res
        .status(200)
        .json(new ApiResponse(200, JSON.parse(cachedData), "Incidents fetched successfully (cached)"));
    }

    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (serviceId) where.serviceId = serviceId;

    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true,
          reportedBy: {
            select: { id: true, name: true, email: true }
          },
          actions: {
            orderBy: { timestamp: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.incident.count({ where })
    ]);

    const result = { 
      incidents, 
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
      .json(new ApiResponse(200, result, "Incidents fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Get incident by ID
export const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `incident:${id}`;
    const cachedIncident = await redis.get(cacheKey);
    
    if (cachedIncident) {
      return res
        .status(200)
        .json(new ApiResponse(200, JSON.parse(cachedIncident), "Incident fetched successfully (cached)"));
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        service: true,
        reportedBy: {
          select: { id: true, name: true, email: true }
        },
        actions: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!incident) {
      throw new ApiError(404, "Incident not found");
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(incident));

    return res
      .status(200)
      .json(new ApiResponse(200, incident, "Incident fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Update incident
export const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, severity, status } = req.body;

    const existingIncident = await prisma.incident.findUnique({ where: { id } });
    if (!existingIncident) {
      throw new ApiError(404, "Incident not found");
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (severity) updateData.severity = severity;
    if (status) {
      updateData.status = status;
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      }
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        reportedBy: {
          select: { id: true, name: true, email: true }
        },
        actions: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, incident, "Incident updated successfully"));
  } catch (error) {
    next(error);
  }
};

// Delete incident
export const deleteIncident = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingIncident = await prisma.incident.findUnique({ where: { id } });
    if (!existingIncident) {
      throw new ApiError(404, "Incident not found");
    }

    // Delete associated actions first
    await prisma.action.deleteMany({ where: { incidentId: id } });
    
    // Delete incident
    await prisma.incident.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Incident deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// Get incidents by service
export const getIncidentsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { serviceId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true,
          reportedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.incident.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        incidents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Service incidents fetched successfully"));
  } catch (error) {
    next(error);
  }
};