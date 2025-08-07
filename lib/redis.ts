import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/env.mjs";

// Conditional Redis initialization - only if environment variables are available
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

// Mock ratelimit for when Redis is not available
const mockRatelimit = {
  limit: async () => ({ success: true }), // Always allow requests when Redis is not available
};

try {
  // Check if Redis environment variables are available
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create a new ratelimiter, that allows 30 requests per 10 seconds
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "10 s"),
      analytics: true,
    });
  } else {
    // Use mock ratelimit when Redis is not available
    ratelimit = mockRatelimit as any;
  }
} catch (error) {
  console.warn("Redis initialization failed, using mock ratelimit:", error);
  ratelimit = mockRatelimit as any;
}

export { redis, ratelimit };
