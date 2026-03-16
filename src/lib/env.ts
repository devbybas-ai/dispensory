import { z } from "zod/v4";

// === SERVER ENVIRONMENT SCHEMA ===

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  // Redis
  REDIS_URL: z.string().min(1).optional(),

  // S3-compatible storage
  S3_BUCKET: z.string().min(1).optional(),
  S3_REGION: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_ENDPOINT: z.string().min(1).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_PHONE_NUMBER: z.string().min(1).optional(),

  // Maps
  MAPS_API_KEY: z.string().min(1).optional(),

  // Email
  EMAIL_FROM: z.string().optional(),

  // Socket.io
  SOCKET_PORT: z.string().optional(),
});

// === CLIENT ENVIRONMENT SCHEMA ===

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL is required"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Dispensory"),
  NEXT_PUBLIC_SOCKET_URL: z.string().optional(),
});

// === VALIDATION ===

function validateEnv() {
  const serverResult = serverEnvSchema.safeParse(process.env);
  const clientResult = clientEnvSchema.safeParse(process.env);

  if (!serverResult.success) {
    const formatted = z.prettifyError(serverResult.error);
    console.error("Server environment validation failed:\n", formatted);
    throw new Error("Invalid server environment variables. Check the console for details.");
  }

  if (!clientResult.success) {
    const formatted = z.prettifyError(clientResult.error);
    console.error("Client environment validation failed:\n", formatted);
    throw new Error("Invalid client environment variables. Check the console for details.");
  }

  return {
    ...serverResult.data,
    ...clientResult.data,
  };
}

export const env = validateEnv();
export type Env = ReturnType<typeof validateEnv>;
