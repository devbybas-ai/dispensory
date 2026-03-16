"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import type { VendorType } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Vendor Onboarding & Management
// License verification, COA tracking
// ─────────────────────────────────────────────────────────────

interface CreateVendorInput {
  type: VendorType;
  name: string;
  legalName?: string;
  licenseNumber?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export async function createVendor(input: CreateVendorInput) {
  const session = await requirePermission("inventory:write");

  const vendor = await db.vendor.create({
    data: {
      type: input.type,
      name: input.name,
      legalName: input.legalName,
      licenseNumber: input.licenseNumber,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
      street: input.street,
      city: input.city,
      state: input.state,
      zip: input.zip,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "Vendor",
    entityId: vendor.id,
    after: vendor,
  });

  return vendor;
}

interface UpdateVendorInput {
  id: string;
  name?: string;
  legalName?: string;
  licenseNumber?: string;
  licenseExpiresAt?: Date;
  contactName?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export async function updateVendor(input: UpdateVendorInput) {
  const session = await requirePermission("inventory:write");

  const before = await db.vendor.findUniqueOrThrow({
    where: { id: input.id },
  });

  const vendor = await db.vendor.update({
    where: { id: input.id },
    data: {
      name: input.name,
      legalName: input.legalName,
      licenseNumber: input.licenseNumber,
      licenseExpiresAt: input.licenseExpiresAt,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
      street: input.street,
      city: input.city,
      state: input.state,
      zip: input.zip,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "update",
    entity: "Vendor",
    entityId: vendor.id,
    before,
    after: vendor,
  });

  return vendor;
}

/** Approve a vendor after license verification. */
export async function approveVendor(vendorId: string) {
  const session = await requirePermission("compliance:write");

  const vendor = await db.vendor.update({
    where: { id: vendorId },
    data: {
      isApproved: true,
      approvedAt: new Date(),
      licenseStatus: "ACTIVE",
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "approve",
    entity: "Vendor",
    entityId: vendorId,
    after: { isApproved: true, approvedAt: vendor.approvedAt },
  });

  return vendor;
}

export async function getVendors(filters?: {
  type?: VendorType;
  isApproved?: boolean;
  search?: string;
}) {
  await requirePermission("inventory:read");

  return db.vendor.findMany({
    where: {
      deletedAt: null,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.isApproved !== undefined && {
        isApproved: filters.isApproved,
      }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          {
            licenseNumber: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    },
    orderBy: { name: "asc" },
  });
}

export async function getVendorById(id: string) {
  await requirePermission("inventory:read");

  return db.vendor.findUniqueOrThrow({
    where: { id },
    include: {
      products: { where: { deletedAt: null } },
      documents: true,
    },
  });
}
