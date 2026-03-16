import { getRedis } from "@/lib/redis";

// === SERVER-SIDE EVENT EMITTER ===
// Publishes events to Redis pub/sub channels for real-time distribution.
// Socket.io server subscribes to these channels and broadcasts to connected clients.
// All emitters are no-ops when Redis is unavailable (graceful degradation).

interface RealtimeEvent {
  premisesId: string;
  event: string;
  data: unknown;
  timestamp: string;
}

/**
 * Publish a message to a Redis pub/sub channel.
 * Silently no-ops when Redis is not available.
 */
async function publishToChannel(channel: string, payload: RealtimeEvent): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return; // Graceful degradation: skip when Redis unavailable
  }

  try {
    await redis.publish(channel, JSON.stringify(payload));
  } catch (err) {
    console.error(
      `[realtime] Failed to publish to ${channel}:`,
      err instanceof Error ? err.message : "Unknown error"
    );
  }
}

/**
 * Emit a POS event (new order, completed, voided, shift changes).
 * Broadcasts to all connected POS clients for the given premises.
 *
 * @param premisesId - The premises this event belongs to
 * @param event - Event name (e.g., "new-order", "order-completed", "order-voided", "shift-change")
 * @param data - Event payload
 */
export async function emitPOSEvent(
  premisesId: string,
  event: string,
  data: unknown
): Promise<void> {
  await publishToChannel("pos-events", {
    premisesId,
    event,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit an inventory event (stock changes, receiving, recalls).
 * Broadcasts to all connected inventory clients for the given premises.
 *
 * @param premisesId - The premises this event belongs to
 * @param event - Event name (e.g., "stock-updated", "package-received", "recall-initiated")
 * @param data - Event payload
 */
export async function emitInventoryEvent(
  premisesId: string,
  event: string,
  data: unknown
): Promise<void> {
  await publishToChannel("inventory-events", {
    premisesId,
    event,
    data,
    timestamp: new Date().toISOString(),
  });
}
