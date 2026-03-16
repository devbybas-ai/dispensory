import { Resend } from "resend";

// === RESEND EMAIL CLIENT SINGLETON ===
// Returns null when RESEND_API_KEY is not configured,
// allowing the app to run without email in development.

const globalForResend = globalThis as unknown as {
  resend: Resend | null | undefined;
};

/**
 * Check whether email sending is configured.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Get the shared Resend client instance.
 * Returns null if RESEND_API_KEY is not set.
 */
export function getResendClient(): Resend | null {
  if (!isEmailConfigured()) {
    return null;
  }

  if (globalForResend.resend === undefined) {
    globalForResend.resend = new Resend(process.env.RESEND_API_KEY);
  }

  return globalForResend.resend;
}
