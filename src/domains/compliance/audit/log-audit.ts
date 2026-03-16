"use server";

import { db } from "@/lib/db";
import type { Session } from "next-auth";

interface AuditLogParams {
  session: Session;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  premisesId?: string | null;
}

/** Log an audit event for every material state change. */
export async function logAuditEvent({
  session,
  action,
  entity,
  entityId,
  before,
  after,
  metadata,
  premisesId,
}: AuditLogParams) {
  await db.auditEvent.create({
    data: {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action,
      entity,
      entityId,
      premisesId: premisesId ?? session.user.premisesId,
      before: before ? JSON.parse(JSON.stringify(before)) : undefined,
      after: after ? JSON.parse(JSON.stringify(after)) : undefined,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}
