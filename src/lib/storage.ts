"use server";

import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";
import { getS3Client, getS3Bucket } from "@/lib/s3";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import type { Session } from "next-auth";
import type { DocumentType } from "@/generated/prisma/client";

// === DOCUMENT STORAGE SERVICE ===
// High-level file operations backed by S3 + Prisma Document model.
// Validates MIME types and file sizes per compliance requirements.

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/** Map MIME types to file extensions for S3 key generation. */
const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/tiff": "tiff",
};

interface DocumentMetadata {
  type: DocumentType;
  name: string;
  mimeType: string;
  sizeBytes: number;
  licenseId?: string;
  localAuthId?: string;
  vendorId?: string;
}

/**
 * Upload a document to S3 and create a Document record in the database.
 *
 * @param file - Raw file bytes
 * @param metadata - Document metadata (type, name, MIME, size, owner)
 * @param session - Authenticated user session
 * @returns The created Document record
 */
export async function uploadDocument(file: Buffer, metadata: DocumentMetadata, session: Session) {
  // Validate S3 is configured
  const s3 = getS3Client();
  if (!s3) {
    throw new Error("File storage is not configured. Set S3_BUCKET environment variable.");
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(metadata.mimeType as AllowedMimeType)) {
    throw new Error(
      `File type "${metadata.mimeType}" is not allowed. Accepted types: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Validate file size
  if (metadata.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size ${Math.round(metadata.sizeBytes / 1024 / 1024)}MB exceeds maximum of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`
    );
  }

  if (metadata.sizeBytes < 1) {
    throw new Error("File cannot be empty.");
  }

  // Generate S3 key: {type}/{YYYY}/{MM}/{uuid}.{ext}
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const uniqueId = crypto.randomUUID();
  const ext = MIME_TO_EXT[metadata.mimeType as AllowedMimeType];
  const s3Key = `${metadata.type.toLowerCase()}/${year}/${month}/${uniqueId}.${ext}`;
  const bucket = getS3Bucket();

  // Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: file,
      ContentType: metadata.mimeType,
      ContentLength: metadata.sizeBytes,
    })
  );

  // Create Document record in database
  const document = await db.document.create({
    data: {
      type: metadata.type,
      name: metadata.name,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
      storageKey: s3Key,
      uploadedBy: session.user.id,
      ...(metadata.licenseId && { licenseId: metadata.licenseId }),
      ...(metadata.localAuthId && { localAuthId: metadata.localAuthId }),
      ...(metadata.vendorId && { vendorId: metadata.vendorId }),
    },
  });

  // Audit trail
  await logAuditEvent({
    session,
    action: "upload",
    entity: "Document",
    entityId: document.id,
    after: {
      type: metadata.type,
      name: metadata.name,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
      s3Key,
    },
  });

  return document;
}

/**
 * Generate a presigned GET URL for a document.
 * URL expires after 15 minutes.
 *
 * @param documentId - The Document record ID
 * @returns Presigned URL string
 */
export async function getDocumentUrl(documentId: string): Promise<string> {
  const s3 = getS3Client();
  if (!s3) {
    throw new Error("File storage is not configured.");
  }

  const document = await db.document.findUniqueOrThrow({
    where: { id: documentId },
  });

  if (document.deletedAt) {
    throw new Error("Document has been deleted.");
  }

  const bucket = getS3Bucket();
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: document.storageKey,
    }),
    { expiresIn: 900 } // 15 minutes
  );

  return url;
}

/**
 * Soft-delete a document: removes from S3 and marks as deleted in the database.
 *
 * @param documentId - The Document record ID
 * @param session - Authenticated user session
 */
export async function deleteDocument(documentId: string, session: Session): Promise<void> {
  const s3 = getS3Client();
  if (!s3) {
    throw new Error("File storage is not configured.");
  }

  const document = await db.document.findUniqueOrThrow({
    where: { id: documentId },
  });

  if (document.deletedAt) {
    throw new Error("Document is already deleted.");
  }

  const bucket = getS3Bucket();

  // Delete from S3
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: document.storageKey,
    })
  );

  // Soft-delete in database
  await db.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  });

  // Audit trail
  await logAuditEvent({
    session,
    action: "delete",
    entity: "Document",
    entityId: documentId,
    before: {
      type: document.type,
      name: document.name,
      storageKey: document.storageKey,
    },
  });
}
