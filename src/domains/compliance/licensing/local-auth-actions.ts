"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import type { LicenseStatus } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Local Authorization CRUD
// ─────────────────────────────────────────────────────────────

interface CreateLocalAuthInput {
  premisesId: string;
  authority: string;
  permitNumber?: string;
  type: string;
  status: LicenseStatus;
  issuedAt?: Date;
  expiresAt?: Date;
}

export async function createLocalAuthorization(input: CreateLocalAuthInput) {
  const session = await requirePermission("compliance:write");

  const localAuth = await db.localAuthorization.create({
    data: {
      premisesId: input.premisesId,
      authority: input.authority,
      permitNumber: input.permitNumber,
      type: input.type,
      status: input.status,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "LocalAuthorization",
    entityId: localAuth.id,
    after: localAuth,
    premisesId: input.premisesId,
  });

  return localAuth;
}

interface UpdateLocalAuthInput {
  id: string;
  authority?: string;
  permitNumber?: string;
  type?: string;
  status?: LicenseStatus;
  issuedAt?: Date;
  expiresAt?: Date;
}

export async function updateLocalAuthorization(input: UpdateLocalAuthInput) {
  const session = await requirePermission("compliance:write");

  const before = await db.localAuthorization.findUniqueOrThrow({
    where: { id: input.id },
  });

  const localAuth = await db.localAuthorization.update({
    where: { id: input.id },
    data: {
      authority: input.authority,
      permitNumber: input.permitNumber,
      type: input.type,
      status: input.status,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "update",
    entity: "LocalAuthorization",
    entityId: localAuth.id,
    before,
    after: localAuth,
    premisesId: localAuth.premisesId,
  });

  return localAuth;
}

export async function getLocalAuthsByPremises(premisesId: string) {
  await requirePermission("compliance:read");

  return db.localAuthorization.findMany({
    where: { premisesId, deletedAt: null },
    include: { documents: true },
    orderBy: { authority: "asc" },
  });
}

export async function getExpiringLocalAuths(premisesId: string, withinDays: number = 90) {
  await requirePermission("compliance:read");

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + withinDays);

  return db.localAuthorization.findMany({
    where: {
      premisesId,
      deletedAt: null,
      status: "ACTIVE",
      expiresAt: { lte: thresholdDate },
    },
    orderBy: { expiresAt: "asc" },
  });
}
