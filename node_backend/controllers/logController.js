import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new log entry
export const createLog = async (req, res, next) => {
  try {
    const { serviceId, level, message, metadata } = req.body;

    if (!serviceId || !level || !message) {
      throw new ApiError(400, "ServiceId, level, and message are required");
    }

    // Check if service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    const log = await prisma.log.create({
      data: {
        serviceId,
        level,
        message,
        metadata: metadata || null,
      },
      include: {
        service: true
      }
    });

    return res
      .status(201)
      .json(new ApiResponse(201, log, "Log created successfully"));
  } catch (error) {
    next(error);
  }
};

// Get all logs
export const getAllLogs = async (req, res, next) => {
  try {
    const { 
      serviceId, 
      level, 
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const where = {};
    if (serviceId) where.serviceId = serviceId;
    if (level) where.level = level;
    if (search) {
      where.message = {
        contains: search,
        mode: 'insensitive'
      };
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.log.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, { 
        logs, 
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Logs fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Get log by ID
export const getLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await prisma.log.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!log) {
      throw new ApiError(404, "Log not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, log, "Log fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Update log (usually not needed, but included for completeness)
export const updateLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { level, message, metadata } = req.body;

    const existingLog = await prisma.log.findUnique({ where: { id } });
    if (!existingLog) {
      throw new ApiError(404, "Log not found");
    }

    const updateData = {};
    if (level) updateData.level = level;
    if (message) updateData.message = message;
    if (metadata !== undefined) updateData.metadata = metadata;

    const log = await prisma.log.update({
      where: { id },
      data: updateData,
      include: {
        service: true
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, log, "Log updated successfully"));
  } catch (error) {
    next(error);
  }
};

// Delete log
export const deleteLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingLog = await prisma.log.findUnique({ where: { id } });
    if (!existingLog) {
      throw new ApiError(404, "Log not found");
    }

    await prisma.log.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Log deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// Get logs by service
export const getLogsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { 
      level, 
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    // Check if service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    const where = { serviceId };
    if (level) where.level = level;
    if (search) {
      where.message = {
        contains: search,
        mode: 'insensitive'
      };
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.log.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Service logs fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Bulk create logs (useful for importing log files)
export const bulkCreateLogs = async (req, res, next) => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      throw new ApiError(400, "Logs array is required and cannot be empty");
    }

    // Validate each log entry
    for (const log of logs) {
      if (!log.serviceId || !log.level || !log.message) {
        throw new ApiError(400, "Each log must have serviceId, level, and message");
      }
    }

    // Check if all services exist
    const serviceIds = [...new Set(logs.map(log => log.serviceId))];
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (services.length !== serviceIds.length) {
      throw new ApiError(404, "One or more services not found");
    }

    const createdLogs = await prisma.log.createMany({
      data: logs.map(log => ({
        serviceId: log.serviceId,
        level: log.level,
        message: log.message,
        metadata: log.metadata || null,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
      }))
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { count: createdLogs.count }, "Logs created successfully"));
  } catch (error) {
    next(error);
  }
};

// Delete logs by date range
export const deleteLogsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate, serviceId } = req.body;

    if (!startDate && !endDate) {
      throw new ApiError(400, "Either startDate or endDate is required");
    }

    const where = {};
    if (serviceId) where.serviceId = serviceId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const deletedLogs = await prisma.log.deleteMany({ where });

    return res
      .status(200)
      .json(new ApiResponse(200, { count: deletedLogs.count }, "Logs deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// Get log statistics
export const getLogStats = async (req, res, next) => {
  try {
    const { serviceId, startDate, endDate } = req.query;

    const where = {};
    if (serviceId) where.serviceId = serviceId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [
      totalLogs,
      infoLogs,
      warnLogs,
      errorLogs,
      recentLogs
    ] = await Promise.all([
      prisma.log.count({ where }),
      prisma.log.count({ where: { ...where, level: "INFO" } }),
      prisma.log.count({ where: { ...where, level: "WARN" } }),
      prisma.log.count({ where: { ...where, level: "ERROR" } }),
      prisma.log.findMany({
        where,
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          service: true
        }
      })
    ]);

    const stats = {
      totalLogs,
      infoLogs,
      warnLogs,
      errorLogs,
      logsByLevel: {
        INFO: infoLogs,
        WARN: warnLogs,
        ERROR: errorLogs
      },
      errorRate: totalLogs > 0 ? (errorLogs / totalLogs * 100).toFixed(2) : 0,
      recentLogs
    };

    return res
      .status(200)
      .json(new ApiResponse(200, stats, "Log statistics fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// Search logs
export const searchLogs = async (req, res, next) => {
  try {
    const { query, serviceId, level, page = 1, limit = 20 } = req.query;

    if (!query) {
      throw new ApiError(400, "Search query is required");
    }

    const where = {
      message: {
        contains: query,
        mode: 'insensitive'
      }
    };

    if (serviceId) where.serviceId = serviceId;
    if (level) where.level = level;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          service: true
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.log.count({ where })
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }, "Log search completed successfully"));
  } catch (error) {
    next(error);
  }
};