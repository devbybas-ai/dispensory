/**
 * In-memory rate limiter for auth endpoints.
 *
 * Uses a sliding window approach: stores timestamps of each request per key,
 * then counts how many fall within the current window.
 *
 * Not suitable for multi-instance deployments -- swap to Redis-backed
 * implementation when scaling horizontally.
 */

interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number;
  /** Maximum requests allowed per interval */
  maxRequests: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** How many requests remain in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  interval: 60_000, // 60 seconds
  maxRequests: 5,
};

/** Stores request timestamps per key */
const requestMap = new Map<string, number[]>();

/** How long to keep entries before garbage collection (5 minutes) */
const CLEANUP_MAX_AGE = 5 * 60 * 1000;

/** Interval between cleanup sweeps (60 seconds) */
const CLEANUP_INTERVAL = 60_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Removes entries older than CLEANUP_MAX_AGE from the store.
 * Called periodically to prevent memory leaks.
 */
function cleanup(): void {
  const cutoff = Date.now() - CLEANUP_MAX_AGE;

  for (const [key, timestamps] of requestMap) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      requestMap.delete(key);
    } else {
      requestMap.set(key, filtered);
    }
  }

  // Stop the timer when there's nothing left to clean
  if (requestMap.size === 0 && cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/** Ensures the periodic cleanup timer is running. */
function ensureCleanup(): void {
  if (cleanupTimer !== null) return;

  cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL);
  // Allow the Node.js process to exit even if the timer is active
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check and consume a rate limit token for the given key.
 *
 * @param key - Unique identifier (e.g. IP address, email, or composite key)
 * @param config - Override the default rate limit settings
 * @returns Whether the request is allowed, remaining tokens, and reset time
 */
export function rateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIG): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.interval;

  // Get existing timestamps and filter to current window
  const existing = requestMap.get(key) ?? [];
  const windowTimestamps = existing.filter((t) => t > windowStart);

  // Determine the reset time: when the oldest request in the window expires
  const oldestInWindow = windowTimestamps[0];
  const resetAt =
    oldestInWindow !== undefined ? oldestInWindow + config.interval : now + config.interval;

  // Check if the limit has been reached
  if (windowTimestamps.length >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt,
    };
  }

  // Record this request
  windowTimestamps.push(now);
  requestMap.set(key, windowTimestamps);

  ensureCleanup();

  return {
    success: true,
    remaining: config.maxRequests - windowTimestamps.length,
    resetAt,
  };
}

/**
 * Pre-configured rate limiter for authentication endpoints.
 * Allows 5 attempts per 60 seconds per identifier.
 *
 * @param identifier - IP address or email address to rate limit
 * @returns Rate limit result
 */
export function authRateLimit(identifier: string): RateLimitResult {
  return rateLimit(`auth:${identifier}`, {
    interval: 60_000,
    maxRequests: 5,
  });
}
