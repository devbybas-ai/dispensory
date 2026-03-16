import Redis from "ioredis";

// === REDIS CLIENT SINGLETON ===
// Graceful degradation: returns null when Redis is unavailable.
// This allows the app to run without Redis in development or
// when optional services (queues, realtime, caching) are not needed.

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn("[redis] REDIS_URL not set -- Redis features disabled.");
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) {
          console.error("[redis] Max reconnection attempts reached. Giving up.");
          return null; // Stop retrying
        }
        // Exponential backoff: 200ms, 400ms, 800ms, 1600ms, 3200ms
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      lazyConnect: false,
    });

    client.on("error", (err: Error) => {
      console.error("[redis] Connection error:", err.message);
    });

    client.on("connect", () => {
      console.info("[redis] Connected successfully.");
    });

    client.on("close", () => {
      console.warn("[redis] Connection closed.");
    });

    return client;
  } catch (err) {
    console.error(
      "[redis] Failed to create client:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return null;
  }
}

/**
 * Get the shared Redis client instance.
 * Returns null if REDIS_URL is not configured or connection failed.
 */
export function getRedis(): Redis | null {
  if (globalForRedis.redis === undefined) {
    globalForRedis.redis = createRedisClient();
  }
  return globalForRedis.redis;
}

/**
 * Check whether Redis is currently connected and ready.
 */
export function isRedisConnected(): boolean {
  const client = getRedis();
  if (!client) return false;
  return client.status === "ready";
}
