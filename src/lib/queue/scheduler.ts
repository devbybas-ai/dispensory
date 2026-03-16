import { complianceQueue, reportsQueue } from "./queues";
import { db } from "@/lib/db";

// === JOB SCHEDULER ===
// Sets up repeatable (cron) jobs for automated background tasks.
// Call once on worker process startup.

/**
 * Register all repeatable jobs.
 * Safe to call multiple times -- BullMQ deduplicates by job name + repeat config.
 */
export async function setupScheduler(): Promise<void> {
  // ─────────────────────────────────────────────────────────────
  // Compliance: Check license expirations daily at 8:00 AM
  // ─────────────────────────────────────────────────────────────
  await complianceQueue.upsertJobScheduler(
    "check-license-expiration-daily",
    {
      pattern: "0 8 * * *", // 8:00 AM every day
      tz: "America/Los_Angeles",
    },
    {
      name: "check-license-expiration",
      data: {},
    }
  );

  console.info("[scheduler] Registered: check-license-expiration (daily at 8:00 AM PT)");

  // ─────────────────────────────────────────────────────────────
  // Reports: Daily sales summary at 11:00 PM
  // Schedules one job per active premises
  // ─────────────────────────────────────────────────────────────
  const premises = await db.premises.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });

  for (const p of premises) {
    await reportsQueue.upsertJobScheduler(
      `daily-sales-summary-${p.id}`,
      {
        pattern: "0 23 * * *", // 11:00 PM every day
        tz: "America/Los_Angeles",
      },
      {
        name: "daily-sales-summary",
        data: {
          premisesId: p.id,
          date: new Date().toISOString().slice(0, 10),
        },
      }
    );

    console.info(
      `[scheduler] Registered: daily-sales-summary for ${p.name} (daily at 11:00 PM PT)`
    );
  }

  console.info("[scheduler] All repeatable jobs registered.");
}
