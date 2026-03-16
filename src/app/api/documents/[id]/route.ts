import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/auth-utils";
import { getDocumentUrl, deleteDocument } from "@/lib/storage";

// === DOCUMENT API ===
// GET  /api/documents/[id] - Get presigned download URL
// DELETE /api/documents/[id] - Soft-delete a document (requires compliance:write)

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    const url = await getDocumentUrl(id);

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get document URL.";

    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("deleted") || message.includes("No Document found")) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    console.error("[api/documents/[id]] GET error:", message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check: compliance:write required for document deletion
    if (!hasPermission(session, "compliance:write")) {
      return NextResponse.json(
        { error: "Forbidden: compliance:write permission required." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    await deleteDocument(id, session);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete document.";

    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("already deleted") || message.includes("No Document found")) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    console.error("[api/documents/[id]] DELETE error:", message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
