import bcrypt from "bcryptjs";
import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import redis from "../redis/redisClient.js";
import { isRateLimited, getIdentifier } from "../middlewares/rateLimiter.js";
import { 
  generateToken,           
  generateAccessToken,     
  generateRefreshToken,    
  verifyRefreshToken       
} from "../utils/jwt.js";

// Using token generation functions from utils/jwt.js
export const register = async (req, res, next) => {
  try {
    const identifier = getIdentifier(req);
    
    // Check rate limit
    const limited = await isRateLimited(identifier, 'auth');
    if (limited) {
      throw new ApiError(429, "Too many registration attempts. Try again later.");
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      throw new ApiError(400, "Name, email, password, and role are required");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, "User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    // Generate both tokens for hybrid auth
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token in Redis (7 days TTL)
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    // Cache user data
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user)); // Cache for 1 hour
    await redis.setex(`user:email:${email}`, 3600, JSON.stringify(user));

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Keep old cookie for backward compatibility (optional)
    const oldToken = generateToken({ userId: user.id, role: user.role });
    res.cookie("jwt", oldToken, { httpOnly: true, secure: false });

    return res
      .status(201)
      .json(new ApiResponse(201, { 
        user, 
        accessToken,  // Send access token in response body
        token: oldToken // Keep for backward compatibility
      }, "User registered successfully"));
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const identifier = getIdentifier(req);
    
    // Check rate limit
    const limited = await isRateLimited(identifier, 'login');
    if (limited) {
      throw new ApiError(429, "Too many login attempts. Try again later.");
    }

    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    // Check cache first
    const cachedUser = await redis.get(`user:email:${email}`);
    let user;

    if (cachedUser) {
      user = JSON.parse(cachedUser);
      // Still need to get password from DB for comparison
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { password: true },
      });
      user.password = dbUser.password;
    } else {
      user = await prisma.user.findUnique({ 
        where: { email },
        select: { id: true, name: true, email: true, role: true, password: true, createdAt: true }
      });
    }

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate both tokens for hybrid auth
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token in Redis (7 days TTL)
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Cache user data
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(userWithoutPassword));
    await redis.setex(`user:email:${email}`, 3600, JSON.stringify(userWithoutPassword));

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Keep old cookie for backward compatibility (optional)
    const oldToken = generateToken({ userId: user.id, role: user.role });
    res.cookie("jwt", oldToken, { httpOnly: true, secure: false });

    return res
      .status(200)
      .json(new ApiResponse(200, { 
        user: userWithoutPassword, 
        accessToken,  // Send access token in response body
        token: oldToken // Keep for backward compatibility
      }, "Login successful"));
  } catch (error) {
    next(error);
  }
};

// NEW: Refresh token endpoint
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token required");
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const userId = decoded.userId;

    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`refresh:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Get user data
    let user;
    const cachedUser = await redis.get(`user:${userId}`);
    
    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      });
      
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      
      await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });

    // Optional: Refresh token rotation (generate new refresh token)
    const newRefreshToken = generateRefreshToken({ userId: user.id });
    await redis.setex(`refresh:${userId}`, 7 * 24 * 60 * 60, newRefreshToken);
    
    res.cookie("refreshToken", newRefreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { 
        accessToken: newAccessToken 
      }, "Token refreshed successfully"));
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again."
      });
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (userId) {
      // Clear refresh token from Redis
      await redis.del(`refresh:${userId}`);
      
      // Clear user cache
      await redis.del(`user:${userId}`);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user) {
        await redis.del(`user:email:${user.email}`);
      }
    }

    // Clear both cookies
    res.clearCookie("refreshToken");
    res.clearCookie("jwt"); // Clear old cookie too
    
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Check cache first
    const cachedUser = await redis.get(`user:${userId}`);
    let user;

    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Cache user data
      await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    next(error);
  }
};
