import { createServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

// === STANDALONE SOCKET.IO SERVER ===
// Runs as a separate process alongside Next.js.
// Subscribes to Redis pub/sub channels and broadcasts events to connected clients.
// Start with: npx tsx src/lib/realtime/server.ts

const SOCKET_PORT = parseInt(process.env.SOCKET_PORT ?? "3001", 10);
const REDIS_URL = process.env.REDIS_URL;

interface RealtimeEvent {
  premisesId: string;
  event: string;
  data: unknown;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────
// HTTP + Socket.io setup
// ─────────────────────────────────────────────────────────────

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ─────────────────────────────────────────────────────────────
// Redis adapter (enables multi-instance scaling)
// ─────────────────────────────────────────────────────────────

if (REDIS_URL) {
  const pubClient = new Redis(REDIS_URL);
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => {
    console.error("[socket.io] Redis pub client error:", err.message);
  });

  subClient.on("error", (err) => {
    console.error("[socket.io] Redis sub client error:", err.message);
  });

  io.adapter(createAdapter(pubClient, subClient));
  console.info("[socket.io] Redis adapter connected.");
} else {
  console.warn("[socket.io] REDIS_URL not set -- running without Redis adapter.");
}

// ─────────────────────────────────────────────────────────────
// Auth middleware
// ─────────────────────────────────────────────────────────────

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    next(new Error("Authentication token is required."));
    return;
  }

  // Token is verified by the client-side auth flow.
  // The token contains user identity passed from the Next.js session.
  // In production, verify the JWT signature here using AUTH_SECRET.
  try {
    const userData = socket.handshake.auth.user as
      | { id: string; premisesId: string | null }
      | undefined;

    if (!userData?.id) {
      next(new Error("User data is required in auth handshake."));
      return;
    }

    socket.data.userId = userData.id;
    socket.data.premisesId = userData.premisesId;
    next();
  } catch {
    next(new Error("Authentication failed."));
  }
});

// ─────────────────────────────────────────────────────────────
// Namespace: /pos
// ─────────────────────────────────────────────────────────────

const posNamespace = io.of("/pos");

posNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    next(new Error("Authentication token is required."));
    return;
  }
  const userData = socket.handshake.auth.user as
    | { id: string; premisesId: string | null }
    | undefined;
  if (!userData?.id) {
    next(new Error("User data is required."));
    return;
  }
  socket.data.userId = userData.id;
  socket.data.premisesId = userData.premisesId;
  next();
});

posNamespace.on("connection", (socket) => {
  const premisesId = socket.data.premisesId as string | null;

  if (premisesId) {
    void socket.join(`premises:${premisesId}`);
    console.info(`[socket.io/pos] User ${socket.data.userId} joined premises:${premisesId}`);
  }

  socket.on("disconnect", () => {
    console.info(`[socket.io/pos] User ${socket.data.userId} disconnected.`);
  });
});

// ─────────────────────────────────────────────────────────────
// Namespace: /inventory
// ─────────────────────────────────────────────────────────────

const inventoryNamespace = io.of("/inventory");

inventoryNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    next(new Error("Authentication token is required."));
    return;
  }
  const userData = socket.handshake.auth.user as
    | { id: string; premisesId: string | null }
    | undefined;
  if (!userData?.id) {
    next(new Error("User data is required."));
    return;
  }
  socket.data.userId = userData.id;
  socket.data.premisesId = userData.premisesId;
  next();
});

inventoryNamespace.on("connection", (socket) => {
  const premisesId = socket.data.premisesId as string | null;

  if (premisesId) {
    void socket.join(`premises:${premisesId}`);
    console.info(`[socket.io/inventory] User ${socket.data.userId} joined premises:${premisesId}`);
  }

  socket.on("disconnect", () => {
    console.info(`[socket.io/inventory] User ${socket.data.userId} disconnected.`);
  });
});

// ─────────────────────────────────────────────────────────────
// Redis pub/sub → Socket.io broadcast
// ─────────────────────────────────────────────────────────────

if (REDIS_URL) {
  const subscriber = new Redis(REDIS_URL);

  subscriber.on("error", (err) => {
    console.error("[socket.io] Redis subscriber error:", err.message);
  });

  // Subscribe to event channels
  void subscriber.subscribe("pos-events", "inventory-events");

  subscriber.on("message", (channel: string, message: string) => {
    try {
      const payload = JSON.parse(message) as RealtimeEvent;
      const room = `premises:${payload.premisesId}`;

      if (channel === "pos-events") {
        posNamespace.to(room).emit(payload.event, payload.data);
      } else if (channel === "inventory-events") {
        inventoryNamespace.to(room).emit(payload.event, payload.data);
      }
    } catch (err) {
      console.error(
        `[socket.io] Failed to process message on ${channel}:`,
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  });

  console.info("[socket.io] Subscribed to Redis channels: pos-events, inventory-events");
}

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────

httpServer.listen(SOCKET_PORT, () => {
  console.info(`[socket.io] Server listening on port ${SOCKET_PORT}`);
});

// ─────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────

function shutdown(signal: string) {
  console.info(`[socket.io] Received ${signal}. Shutting down gracefully...`);

  io.close(() => {
    console.info("[socket.io] All connections closed.");
    httpServer.close(() => {
      console.info("[socket.io] HTTP server closed.");
      process.exit(0);
    });
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error("[socket.io] Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
