import { Worker, type Job } from "bullmq";
import { connection } from "../connection";
import { notificationQueue } from "../queues";
import { db } from "@/lib/db";
import { licenseExpirationAlert } from "@/lib/email/templates";

// === COMPLIANCE WORKER ===
// Processes background compliance jobs.
// Runs outside of the Next.js request lifecycle (no auth session).

/**
 * Check for licenses expiring within 30, 60, or 90 days.
 * For each expiring license, enqueue an email notification.
 */
async function handleCheckLicenseExpiration(): Promise<void> {
  const now = new Date();
  const thresholds = [
    { days: 30, urgency: "critical" as const },
    { days: 60, urgency: "warning" as const },
    { days: 90, urgency: "notice" as const },
  ];

  for (const threshold of thresholds) {
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() + threshold.days);

    // Find active licenses expiring within this threshold
    const expiringLicenses = await db.license.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        expiresAt: {
          gte: now, // Not yet expired
          lte: cutoffDate, // But will expire within threshold
        },
      },
      include: {
        premises: {
          include: {
            business: true,
            users: {
              where: {
                role: { in: ["ADMIN", "MANAGER"] },
                isActive: true,
                deletedAt: null,
              },
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    for (const license of expiringLicenses) {
      const daysUntilExpiry = Math.ceil(
        (license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const dispensaryName = license.premises.business.name;
      const premisesName = license.premises.name;

      // Notify all admins and managers for this premises
      for (const user of license.premises.users) {
        const template = licenseExpirationAlert({
          dispensaryName,
          premisesName,
          licenseNumber: license.licenseNumber,
          licenseType: license.licenseType,
          expiresAt: license.expiresAt.toISOString(),
          daysUntilExpiry,
          urgency: threshold.urgency,
          recipientName: user.name,
        });

        await notificationQueue.add("send-email", {
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      }
    }

    console.info(
      `[compliance-worker] Found ${expiringLicenses.length} licenses expiring within ${threshold.days} days.`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Worker instance
// ─────────────────────────────────────────────────────────────

export const complianceWorker = new Worker(
  "compliance",
  async (job: Job) => {
    console.info(`[compliance-worker] Processing job: ${job.name} (${job.id})`);

    switch (job.name) {
      case "check-license-expiration":
        await handleCheckLicenseExpiration();
        break;
      default:
        console.warn(`[compliance-worker] Unknown job name: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 1, // Process one compliance job at a time
  }
);

complianceWorker.on("completed", (job) => {
  console.info(`[compliance-worker] Completed job: ${job.name} (${job.id})`);
});

complianceWorker.on("failed", (job, err) => {
  console.error(`[compliance-worker] Failed job: ${job?.name} (${job?.id}):`, err.message);
});
