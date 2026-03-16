import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadDocument } from "@/lib/storage";
import type { DocumentType } from "@/generated/prisma/client";

// === FILE UPLOAD API ===
// POST /api/upload
// Accepts multipart/form-data with:
//   file: File (required)
//   type: DocumentType (required)
//   name: string (required)
//   licenseId?: string
//   localAuthId?: string
//   vendorId?: string

const VALID_DOCUMENT_TYPES = [
  "LICENSE",
  "PERMIT",
  "COA",
  "MANIFEST",
  "RECEIPT",
  "ID_SCAN",
  "PHOTO",
  "OTHER",
] as const;

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Extract metadata fields
    const type = formData.get("type") as string | null;
    const name = formData.get("name") as string | null;
    const licenseId = formData.get("licenseId") as string | null;
    const localAuthId = formData.get("localAuthId") as string | null;
    const vendorId = formData.get("vendorId") as string | null;

    if (!type || !VALID_DOCUMENT_TYPES.includes(type as (typeof VALID_DOCUMENT_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Document name is required." }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload document
    const document = await uploadDocument(
      buffer,
      {
        type: type as DocumentType,
        name: name.trim(),
        mimeType: file.type,
        sizeBytes: file.size,
        ...(licenseId && { licenseId }),
        ...(localAuthId && { localAuthId }),
        ...(vendorId && { vendorId }),
      },
      session
    );

    return NextResponse.json(
      {
        id: document.id,
        type: document.type,
        name: document.name,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";

    // Client errors (validation failures) return 400
    if (
      message.includes("not allowed") ||
      message.includes("exceeds maximum") ||
      message.includes("cannot be empty") ||
      message.includes("not configured")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[api/upload] Error:", message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
