import { Worker, type Job } from "bullmq";
import { connection } from "../connection";
import { sendEmail } from "@/lib/email/send";

// === NOTIFICATION WORKER ===
// Processes email (and future SMS) notification jobs.
// Rate-limited to prevent overwhelming email providers.

interface SendEmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email notification.
 */
async function handleSendEmail(job: Job<SendEmailData>): Promise<void> {
  const { to, subject, html, text } = job.data;

  const result = await sendEmail({ to, subject, html, text });

  if (!result.success) {
    throw new Error(`Failed to send email to ${to}: ${subject}`);
  }

  console.info(`[notification-worker] Email sent to ${to} (id: ${result.id ?? "none"})`);
}

// ─────────────────────────────────────────────────────────────
// Worker instance
// ─────────────────────────────────────────────────────────────

export const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    console.info(`[notification-worker] Processing job: ${job.name} (${job.id})`);

    switch (job.name) {
      case "send-email":
        await handleSendEmail(job as Job<SendEmailData>);
        break;
      default:
        console.warn(`[notification-worker] Unknown job name: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 10, // Process up to 10 notifications concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per 1 second
    },
  }
);

notificationWorker.on("completed", (job) => {
  console.info(`[notification-worker] Completed job: ${job.name} (${job.id})`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[notification-worker] Failed job: ${job?.name} (${job?.id}):`, err.message);
});
