import redis from "../redis/redisClient.js";

// Simple rate limiter function based on your implementation
async function isRateLimited(userId, limitType = 'api') {
  const limits = {
    auth: { windowSize: 15 * 60 * 1000, maxRequests: 5 }, // 15 minutes, 5 requests
    login: { windowSize: 15 * 60 * 1000, maxRequests: 3 }, // 15 minutes, 3 requests  
    api: { windowSize: 60 * 1000, maxRequests: 100 }, // 1 minute, 100 requests
    crud: { windowSize: 60 * 1000, maxRequests: 50 }, // 1 minute, 50 requests
    incident: { windowSize: 60 * 1000, maxRequests: 10 }, // 1 minute, 10 requests
    logs: { windowSize: 60 * 1000, maxRequests: 200 }, // 1 minute, 200 requests
    bulk: { windowSize: 60 * 1000, maxRequests: 5 } // 1 minute, 5 requests
  };

  const config = limits[limitType] || limits.api;
  const key = `sliding-window:${limitType}:${userId}`;
  const now = Date.now();

  try {
    // 1. Add current request with timestamp
    await redis.zadd(key, now, `${userId}-${now}-${Math.random()}`);

    // 2. Remove old requests outside window  
    await redis.zremrangebyscore(key, 0, now - config.windowSize);

    // 3. Count requests in the last window
    const count = await redis.zcard(key);

    // 4. Set expiry to auto-cleanup
    await redis.expire(key, Math.ceil(config.windowSize / 1000));

    return count > config.maxRequests;
  } catch (error) {
    console.error('Rate limiter error:', error);
    return false; // Fail open
  }
}

// Get identifier from request (IP or user ID)
function getIdentifier(req) {
  return req.user?.userId || req.ip || 'anonymous';
}

export { isRateLimited, getIdentifier };
