import type { ConnectionOptions } from "bullmq";

// === BULLMQ CONNECTION CONFIG ===
// Parses REDIS_URL into the host/port/password format that BullMQ expects.
// BullMQ uses ioredis internally but requires ConnectionOptions, not a URL string.

/**
 * Parse a Redis URL into BullMQ ConnectionOptions.
 *
 * Supports formats:
 *   redis://host:port
 *   redis://:password@host:port
 *   redis://user:password@host:port/db
 *   rediss://... (TLS)
 */
function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);

  const options: ConnectionOptions = {
    host: parsed.hostname || "127.0.0.1",
    port: parseInt(parsed.port || "6379", 10),
  };

  if (parsed.password) {
    options.password = decodeURIComponent(parsed.password);
  }

  if (parsed.username && parsed.username !== "default") {
    options.username = decodeURIComponent(parsed.username);
  }

  // Database number from path (e.g., /1)
  const dbMatch = parsed.pathname.match(/^\/(\d+)$/);
  if (dbMatch?.[1]) {
    options.db = parseInt(dbMatch[1], 10);
  }

  // TLS for rediss:// protocol
  if (parsed.protocol === "rediss:") {
    options.tls = {};
  }

  return options;
}

/**
 * BullMQ connection options parsed from REDIS_URL.
 * Falls back to localhost:6379 when REDIS_URL is not set.
 */
export const connection: ConnectionOptions = process.env.REDIS_URL
  ? parseRedisUrl(process.env.REDIS_URL)
  : { host: "127.0.0.1", port: 6379 };
