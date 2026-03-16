"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import type { LicenseType, LicenseStatus } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// License CRUD (DCC licenses, seller's permits, etc.)
// ─────────────────────────────────────────────────────────────

interface CreateLicenseInput {
  premisesId: string;
  licenseType: LicenseType;
  licenseNumber: string;
  status: LicenseStatus;
  issuedBy: string;
  issuedAt?: Date;
  expiresAt: Date;
  warningDays?: number;
}

export async function createLicense(input: CreateLicenseInput) {
  const session = await requirePermission("compliance:write");

  const license = await db.license.create({
    data: {
      premisesId: input.premisesId,
      licenseType: input.licenseType,
      licenseNumber: input.licenseNumber,
      status: input.status,
      issuedBy: input.issuedBy,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      warningDays: input.warningDays ?? 90,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "License",
    entityId: license.id,
    after: license,
    premisesId: input.premisesId,
  });

  return license;
}

interface UpdateLicenseInput {
  id: string;
  status?: LicenseStatus;
  expiresAt?: Date;
  renewedAt?: Date;
  warningDays?: number;
}

export async function updateLicense(input: UpdateLicenseInput) {
  const session = await requirePermission("compliance:write");

  const before = await db.license.findUniqueOrThrow({
    where: { id: input.id },
  });

  const license = await db.license.update({
    where: { id: input.id },
    data: {
      status: input.status,
      expiresAt: input.expiresAt,
      renewedAt: input.renewedAt,
      warningDays: input.warningDays,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "update",
    entity: "License",
    entityId: license.id,
    before,
    after: license,
    premisesId: license.premisesId,
  });

  return license;
}

export async function getLicensesByPremises(premisesId: string) {
  await requirePermission("compliance:read");

  return db.license.findMany({
    where: { premisesId, deletedAt: null },
    include: { documents: true },
    orderBy: { expiresAt: "asc" },
  });
}

export async function getLicenseById(id: string) {
  await requirePermission("compliance:read");

  return db.license.findUniqueOrThrow({
    where: { id },
    include: { documents: true, premises: true },
  });
}

// ─────────────────────────────────────────────────────────────
// Expiration alerts
// ─────────────────────────────────────────────────────────────

export async function getExpiringLicenses(premisesId: string, withinDays: number = 90) {
  await requirePermission("compliance:read");

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + withinDays);

  return db.license.findMany({
    where: {
      premisesId,
      deletedAt: null,
      status: "ACTIVE",
      expiresAt: { lte: thresholdDate },
    },
    orderBy: { expiresAt: "asc" },
  });
}

export async function softDeleteLicense(id: string) {
  const session = await requirePermission("compliance:write");

  const before = await db.license.findUniqueOrThrow({
    where: { id },
  });

  const license = await db.license.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "delete",
    entity: "License",
    entityId: license.id,
    before,
    premisesId: license.premisesId,
  });

  return license;
}
