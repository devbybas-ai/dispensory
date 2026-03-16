import { getResendClient, isEmailConfigured } from "./client";

// === EMAIL SENDING SERVICE ===
// Wraps the Resend API with graceful fallback to console logging
// when email is not configured (development mode).

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
}

const DEFAULT_FROM = "Dispensory <noreply@dispensory.com>";

/**
 * Send an email via Resend.
 * Falls back to console.log when RESEND_API_KEY is not configured.
 *
 * @param params - Email parameters (to, subject, html, optional text)
 * @returns Success status and optional message ID
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  // Development fallback: log email to console
  if (!isEmailConfigured()) {
    console.info("[email] RESEND_API_KEY not configured. Logging email instead:");
    console.info(`[email]   From: ${from}`);
    console.info(`[email]   To: ${params.to}`);
    console.info(`[email]   Subject: ${params.subject}`);
    if (params.text) {
      console.info(`[email]   Body (text): ${params.text.substring(0, 200)}...`);
    }
    return { success: true };
  }

  const resend = getResendClient();
  if (!resend) {
    console.error("[email] Resend client unavailable.");
    return { success: false };
  }

  try {
    const response = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text && { text: params.text }),
    });

    if (response.error) {
      console.error("[email] Send failed:", response.error.message);
      return { success: false };
    }

    return { success: true, id: response.data?.id };
  } catch (err) {
    console.error("[email] Send error:", err instanceof Error ? err.message : "Unknown error");
    return { success: false };
  }
}
