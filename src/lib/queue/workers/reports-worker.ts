import { Worker, type Job } from "bullmq";
import { connection } from "../connection";
import { notificationQueue } from "../queues";
import { db } from "@/lib/db";
import { dailySalesReport } from "@/lib/email/templates";

// === REPORTS WORKER ===
// Processes background reporting jobs.
// Generates summaries and enqueues email notifications.

interface DailySalesSummaryData {
  premisesId: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

/** Safely convert a Prisma Decimal or null to number. */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/**
 * Generate daily sales summary for a premises and email it to managers.
 */
async function handleDailySalesSummary(job: Job<DailySalesSummaryData>): Promise<void> {
  const { premisesId, date } = job.data;

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  // Get premises info
  const premises = await db.premises.findUniqueOrThrow({
    where: { id: premisesId },
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
  });

  // Completed orders aggregate
  const completedAgg = await db.order.aggregate({
    where: {
      premisesId,
      status: "COMPLETED",
      completedAt: { gte: dayStart, lte: dayEnd },
      deletedAt: null,
    },
    _count: { id: true },
    _sum: {
      subtotal: true,
      totalTax: true,
      totalAmount: true,
    },
  });

  const totalOrders = completedAgg._count.id;
  const subtotal = toNumber(completedAgg._sum.subtotal);
  const totalTax = toNumber(completedAgg._sum.totalTax);
  const grandTotal = toNumber(completedAgg._sum.totalAmount);
  const averageOrderValue =
    totalOrders > 0 ? Math.round((grandTotal / totalOrders) * 100) / 100 : 0;

  // Voided orders
  const voidedAgg = await db.order.aggregate({
    where: {
      premisesId,
      status: "VOIDED",
      voidedAt: { gte: dayStart, lte: dayEnd },
      deletedAt: null,
    },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  const voidCount = voidedAgg._count.id;
  const voidedAmount = toNumber(voidedAgg._sum.totalAmount);

  // Payment breakdown
  const paymentGroups = await db.payment.groupBy({
    by: ["method"],
    where: {
      order: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: dayStart, lte: dayEnd },
        deletedAt: null,
      },
      status: "COMPLETED",
    },
    _count: { id: true },
    _sum: { amount: true },
  });

  const paymentBreakdown = paymentGroups.map((group) => ({
    method: group.method,
    count: group._count.id,
    total: toNumber(group._sum.amount),
  }));

  // Send report to all admins and managers
  const dispensaryName = premises.business.name;

  for (const user of premises.users) {
    const template = dailySalesReport({
      dispensaryName,
      premisesName: premises.name,
      date,
      totalOrders,
      subtotal,
      totalTax,
      grandTotal,
      averageOrderValue,
      voidCount,
      voidedAmount,
      paymentBreakdown,
      recipientName: user.name,
    });

    await notificationQueue.add("send-email", {
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  console.info(
    `[reports-worker] Daily sales summary for ${premises.name} (${date}): ${totalOrders} orders, $${grandTotal.toFixed(2)} total`
  );
}

// ─────────────────────────────────────────────────────────────
// Worker instance
// ─────────────────────────────────────────────────────────────

export const reportsWorker = new Worker(
  "reports",
  async (job: Job) => {
    console.info(`[reports-worker] Processing job: ${job.name} (${job.id})`);

    switch (job.name) {
      case "daily-sales-summary":
        await handleDailySalesSummary(job as Job<DailySalesSummaryData>);
        break;
      default:
        console.warn(`[reports-worker] Unknown job name: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 2, // Process up to 2 reports concurrently
  }
);

reportsWorker.on("completed", (job) => {
  console.info(`[reports-worker] Completed job: ${job.name} (${job.id})`);
});

reportsWorker.on("failed", (job, err) => {
  console.error(`[reports-worker] Failed job: ${job?.name} (${job?.id}):`, err.message);
});
