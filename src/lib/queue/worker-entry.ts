import { complianceWorker } from "./workers/compliance-worker";
import { notificationWorker } from "./workers/notification-worker";
import { reportsWorker } from "./workers/reports-worker";
import { setupScheduler } from "./scheduler";

// === WORKER PROCESS ENTRY POINT ===
// Standalone Node.js process that runs all BullMQ workers.
// Start with: npx tsx src/lib/queue/worker-entry.ts
//
// This file imports all workers (which auto-register with BullMQ)
// and sets up the repeatable job scheduler.

async function main() {
  console.info("[worker-entry] Starting Dispensory background workers...");

  // Log worker registration
  console.info("[worker-entry] Compliance worker: registered");
  console.info("[worker-entry] Notification worker: registered");
  console.info("[worker-entry] Reports worker: registered");

  // Set up repeatable jobs (cron schedules)
  try {
    await setupScheduler();
  } catch (err) {
    console.error(
      "[worker-entry] Failed to setup scheduler:",
      err instanceof Error ? err.message : "Unknown error"
    );
    // Don't exit -- workers can still process manually enqueued jobs
  }

  console.info("[worker-entry] All workers running. Press Ctrl+C to stop.");
}

// ─────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.info(`[worker-entry] Received ${signal}. Shutting down workers...`);

  try {
    await Promise.all([
      complianceWorker.close(),
      notificationWorker.close(),
      reportsWorker.close(),
    ]);

    console.info("[worker-entry] All workers closed successfully.");
    process.exit(0);
  } catch (err) {
    console.error(
      "[worker-entry] Error during shutdown:",
      err instanceof Error ? err.message : "Unknown error"
    );
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Prevent unhandled rejections from crashing the process
process.on("unhandledRejection", (reason) => {
  console.error("[worker-entry] Unhandled rejection:", reason);
});

void main();
