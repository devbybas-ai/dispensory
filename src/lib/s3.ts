import { S3Client } from "@aws-sdk/client-s3";

// === S3 CLIENT SINGLETON ===
// Returns null when S3 credentials are not configured,
// allowing the app to start without object storage.

const globalForS3 = globalThis as unknown as {
  s3Client: S3Client | null | undefined;
};

/**
 * Check whether S3 storage is configured.
 * Requires S3_BUCKET at minimum; other settings have defaults for AWS.
 */
export function isS3Configured(): boolean {
  return !!process.env.S3_BUCKET;
}

/**
 * Get the S3 bucket name from environment.
 * Throws if S3_BUCKET is not set.
 */
export function getS3Bucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("[s3] S3_BUCKET environment variable is not set.");
  }
  return bucket;
}

/**
 * Get the shared S3Client instance.
 * Returns null if S3_BUCKET is not configured.
 */
export function getS3Client(): S3Client | null {
  if (!isS3Configured()) {
    return null;
  }

  if (globalForS3.s3Client === undefined) {
    const endpoint = process.env.S3_ENDPOINT;

    globalForS3.s3Client = new S3Client({
      region: process.env.S3_REGION ?? "us-west-2",
      ...(process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY && {
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          },
        }),
      ...(endpoint && {
        endpoint,
        forcePathStyle: true, // Required for MinIO and other S3-compatible services
      }),
    });
  }

  return globalForS3.s3Client;
}
