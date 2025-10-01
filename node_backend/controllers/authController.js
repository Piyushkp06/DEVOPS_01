import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../prisma/prismaClient.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import redis from "../redis/redisClient.js";
import { isRateLimited, getIdentifier } from "../middlewares/rateLimiter.js";

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "7d" });
};
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

    const token = generateToken({ userId: user.id, role: user.role });

    // Cache user data
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user)); // Cache for 1 hour
    await redis.setex(`user:email:${email}`, 3600, JSON.stringify(user));

    res.cookie("jwt", token, { httpOnly: true, secure: false });

    return res
      .status(201)
      .json(new ApiResponse(201, { user, token }, "User registered successfully"));
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

    const token = generateToken({ userId: user.id, role: user.role });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Cache user data
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(userWithoutPassword));
    await redis.setex(`user:email:${email}`, 3600, JSON.stringify(userWithoutPassword));

    res.cookie("jwt", token, { httpOnly: true, secure: false });

    return res
      .status(200)
      .json(new ApiResponse(200, { user: userWithoutPassword, token }, "Login successful"));
  } catch (error) {
    next(error);
  }
};
export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (userId) {
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

    res.clearCookie("jwt");
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
