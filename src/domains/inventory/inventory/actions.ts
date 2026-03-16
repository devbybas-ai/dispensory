"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import { validateTransition } from "./state-machine";
import type { InventoryState, AdjustmentReason } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Inventory State Transitions (reason-coded, audit-logged)
// ─────────────────────────────────────────────────────────────

interface TransitionStateInput {
  packageId: string;
  toState: InventoryState;
  reason: AdjustmentReason;
  note?: string;
  toLocationId?: string;
  quantityDelta?: number; // Negative for decreases
}

/** Transition a package to a new inventory state with full audit trail. */
export async function transitionPackageState(input: TransitionStateInput) {
  const session = await requirePermission("inventory:write");

  const pkg = await db.package.findUniqueOrThrow({
    where: { id: input.packageId },
  });

  // Validate state transition
  const validation = validateTransition(pkg.state, input.toState, input.reason);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const quantityDelta = input.quantityDelta ?? 0;
  const newQuantity = Number(pkg.quantity) + quantityDelta;
  if (newQuantity < 0) {
    throw new Error(`Insufficient quantity. Current: ${pkg.quantity}, Delta: ${quantityDelta}`);
  }

  // Execute transition in a transaction
  const [updatedPackage, adjustment] = await db.$transaction([
    db.package.update({
      where: { id: input.packageId },
      data: {
        state: input.toState,
        quantity: newQuantity,
        locationId: input.toLocationId ?? pkg.locationId,
        updatedBy: session.user.id,
      },
    }),
    db.inventoryAdjustment.create({
      data: {
        packageId: input.packageId,
        reason: input.reason,
        note: input.note,
        fromState: pkg.state,
        toState: input.toState,
        quantityBefore: pkg.quantity,
        quantityAfter: newQuantity,
        quantityDelta: quantityDelta,
        fromLocationId: pkg.locationId,
        toLocationId: input.toLocationId ?? pkg.locationId,
        adjustedBy: session.user.id,
      },
    }),
  ]);

  await logAuditEvent({
    session,
    action: "state_change",
    entity: "Package",
    entityId: input.packageId,
    before: { state: pkg.state, quantity: pkg.quantity },
    after: { state: input.toState, quantity: newQuantity },
    metadata: {
      reason: input.reason,
      note: input.note,
      adjustmentId: adjustment.id,
      metrcUid: pkg.metrcUid,
    },
  });

  return updatedPackage;
}

/** Move a package to a different location. */
export async function movePackage(packageId: string, toLocationId: string, note?: string) {
  const session = await requirePermission("inventory:write");

  const pkg = await db.package.findUniqueOrThrow({
    where: { id: packageId },
  });

  const [updatedPackage] = await db.$transaction([
    db.package.update({
      where: { id: packageId },
      data: {
        locationId: toLocationId,
        updatedBy: session.user.id,
      },
    }),
    db.inventoryAdjustment.create({
      data: {
        packageId,
        reason: "TRANSFER",
        note,
        fromState: pkg.state,
        toState: pkg.state,
        quantityBefore: pkg.quantity,
        quantityAfter: pkg.quantity,
        quantityDelta: 0,
        fromLocationId: pkg.locationId,
        toLocationId,
        adjustedBy: session.user.id,
      },
    }),
  ]);

  await logAuditEvent({
    session,
    action: "transfer",
    entity: "Package",
    entityId: packageId,
    before: { locationId: pkg.locationId },
    after: { locationId: toLocationId },
    metadata: { metrcUid: pkg.metrcUid },
  });

  return updatedPackage;
}

/** Put a package on hold (e.g., pending investigation). */
export async function holdPackage(packageId: string, holdReason: string) {
  const session = await requirePermission("inventory:write");

  const pkg = await db.package.update({
    where: { id: packageId },
    data: {
      isOnHold: true,
      holdReason,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "hold",
    entity: "Package",
    entityId: packageId,
    after: { isOnHold: true, holdReason },
    metadata: { metrcUid: pkg.metrcUid },
  });

  return pkg;
}

/** Release a package from hold. */
export async function releasePackageHold(packageId: string) {
  const session = await requirePermission("inventory:write");

  const pkg = await db.package.update({
    where: { id: packageId },
    data: {
      isOnHold: false,
      holdReason: null,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "release_hold",
    entity: "Package",
    entityId: packageId,
    after: { isOnHold: false },
    metadata: { metrcUid: pkg.metrcUid },
  });

  return pkg;
}

// ─────────────────────────────────────────────────────────────
// Inventory Queries
// ─────────────────────────────────────────────────────────────

export async function getPackagesByState(premisesId: string, state?: InventoryState) {
  await requirePermission("inventory:read");

  return db.package.findMany({
    where: {
      deletedAt: null,
      location: { premisesId },
      ...(state && { state }),
    },
    include: {
      batch: { include: { productMaster: true } },
      location: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPackageByMetrcUid(metrcUid: string) {
  await requirePermission("inventory:read");

  return db.package.findUniqueOrThrow({
    where: { metrcUid },
    include: {
      batch: { include: { productMaster: { include: { vendor: true } } } },
      location: true,
      adjustments: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function getPackageHistory(packageId: string) {
  await requirePermission("inventory:read");

  return db.inventoryAdjustment.findMany({
    where: { packageId },
    orderBy: { createdAt: "desc" },
  });
}
