import { Queue } from "bullmq";
import { connection } from "./connection";

// === QUEUE DEFINITIONS ===
// Each queue handles a specific category of background jobs.
// Workers for each queue run in a separate process (worker-entry.ts).

// ─────────────────────────────────────────────────────────────
// Job data types
// ─────────────────────────────────────────────────────────────

/** Compliance queue job data types. */
export interface ComplianceJobData {
  "check-license-expiration": Record<string, never>; // No input needed
}

/** Notification queue job data types. */
export interface NotificationJobData {
  "send-email": {
    to: string;
    subject: string;
    html: string;
    text?: string;
  };
}

/** Reports queue job data types. */
export interface ReportsJobData {
  "daily-sales-summary": {
    premisesId: string;
    date: string; // ISO date string (YYYY-MM-DD)
  };
}

// ─────────────────────────────────────────────────────────────
// Queue instances
// ─────────────────────────────────────────────────────────────

/** Compliance-related background jobs (license checks, audits). */
export const complianceQueue = new Queue<ComplianceJobData[keyof ComplianceJobData], void, string>(
  "compliance",
  {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  }
);

/** Notification jobs (email, SMS). */
export const notificationQueue = new Queue<
  NotificationJobData[keyof NotificationJobData],
  void,
  string
>("notifications", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});

/** Reporting jobs (daily summaries, exports). */
export const reportsQueue = new Queue<ReportsJobData[keyof ReportsJobData], void, string>(
  "reports",
  {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 200 },
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 10000,
      },
    },
  }
);
