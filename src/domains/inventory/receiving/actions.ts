"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";

// ─────────────────────────────────────────────────────────────
// Receiving Flow
// Manifest scan → UID reconciliation → quarantine/accept
// ─────────────────────────────────────────────────────────────

interface ReceivingLineInput {
  metrcUid: string;
  batchId: string;
  expectedQuantity: number;
  unitOfMeasure?: string;
}

interface CreateReceivingInput {
  premisesId: string;
  vendorId: string;
  manifestNumber?: string;
  notes?: string;
  lines: ReceivingLineInput[];
}

/**
 * Create a receiving record with packages.
 * New packages start in INBOUND state pending inspection.
 */
export async function createReceivingRecord(input: CreateReceivingInput) {
  const session = await requirePermission("inventory:receive");

  // Verify vendor is approved
  const vendor = await db.vendor.findUniqueOrThrow({
    where: { id: input.vendorId },
  });
  if (!vendor.isApproved) {
    throw new Error("Cannot receive from unapproved vendor.");
  }

  const record = await db.$transaction(async (tx) => {
    // Create the receiving record
    const receivingRecord = await tx.receivingRecord.create({
      data: {
        premisesId: input.premisesId,
        vendorId: input.vendorId,
        manifestNumber: input.manifestNumber,
        receivedBy: session.user.id,
        notes: input.notes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Create packages and receiving lines
    for (const line of input.lines) {
      const pkg = await tx.package.create({
        data: {
          batchId: line.batchId,
          metrcUid: line.metrcUid,
          state: "INBOUND",
          quantity: line.expectedQuantity,
          initialQuantity: line.expectedQuantity,
          unitOfMeasure: line.unitOfMeasure ?? "each",
          packageDate: new Date(),
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      });

      await tx.receivingLine.create({
        data: {
          receivingRecordId: receivingRecord.id,
          packageId: pkg.id,
          expectedQuantity: line.expectedQuantity,
          receivedQuantity: line.expectedQuantity,
        },
      });

      // Log initial inventory adjustment
      await tx.inventoryAdjustment.create({
        data: {
          packageId: pkg.id,
          reason: "RECEIVED",
          toState: "INBOUND",
          quantityBefore: 0,
          quantityAfter: line.expectedQuantity,
          quantityDelta: line.expectedQuantity,
          adjustedBy: session.user.id,
        },
      });
    }

    return receivingRecord;
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "ReceivingRecord",
    entityId: record.id,
    after: record,
    premisesId: input.premisesId,
    metadata: {
      vendorId: input.vendorId,
      manifestNumber: input.manifestNumber,
      lineCount: input.lines.length,
    },
  });

  return record;
}

interface ReconcileLineInput {
  receivingLineId: string;
  receivedQuantity: number;
  accepted: boolean;
  rejectReason?: string;
  locationId?: string;
}

/**
 * Reconcile received packages.
 * Accepted packages move to QUARANTINED (pending lab test) or AVAILABLE.
 * Rejected packages are logged with reason.
 */
export async function reconcileReceivingLine(input: ReconcileLineInput) {
  const session = await requirePermission("inventory:receive");

  const line = await db.receivingLine.findUniqueOrThrow({
    where: { id: input.receivingLineId },
    include: { package: { include: { batch: true } } },
  });

  const newState = input.accepted
    ? line.package.batch.testingStatus === "PASSED"
      ? "AVAILABLE"
      : "QUARANTINED"
    : "RETURNED";

  await db.$transaction([
    // Update receiving line
    db.receivingLine.update({
      where: { id: input.receivingLineId },
      data: {
        receivedQuantity: input.receivedQuantity,
        accepted: input.accepted,
        rejectReason: input.rejectReason,
      },
    }),
    // Transition package state
    db.package.update({
      where: { id: line.packageId },
      data: {
        state: newState,
        quantity: input.receivedQuantity,
        locationId: input.locationId,
        updatedBy: session.user.id,
      },
    }),
    // Log adjustment
    db.inventoryAdjustment.create({
      data: {
        packageId: line.packageId,
        reason: input.accepted ? "RECEIVED" : "RETURNED_TO_VENDOR",
        note: input.rejectReason,
        fromState: "INBOUND",
        toState: newState,
        quantityBefore: line.package.quantity,
        quantityAfter: input.receivedQuantity,
        quantityDelta: input.receivedQuantity - Number(line.package.quantity),
        toLocationId: input.locationId,
        adjustedBy: session.user.id,
      },
    }),
  ]);

  await logAuditEvent({
    session,
    action: "reconcile",
    entity: "ReceivingLine",
    entityId: input.receivingLineId,
    metadata: {
      accepted: input.accepted,
      rejectReason: input.rejectReason,
      newState,
      metrcUid: line.package.metrcUid,
    },
  });
}

/** Mark a receiving record as fully reconciled. */
export async function finalizeReceiving(receivingRecordId: string) {
  const session = await requirePermission("inventory:receive");

  // Verify all lines are reconciled
  const lines = await db.receivingLine.findMany({
    where: { receivingRecordId },
  });
  const unreconciled = lines.filter((l) => Number(l.receivedQuantity) === 0 && !l.rejectReason);
  if (unreconciled.length > 0) {
    throw new Error(`${unreconciled.length} lines still need reconciliation.`);
  }

  const record = await db.receivingRecord.update({
    where: { id: receivingRecordId },
    data: {
      isReconciled: true,
      reconciledAt: new Date(),
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "finalize",
    entity: "ReceivingRecord",
    entityId: receivingRecordId,
    after: { isReconciled: true },
    premisesId: record.premisesId,
  });

  return record;
}

export async function getReceivingRecords(premisesId: string) {
  await requirePermission("inventory:receive");

  return db.receivingRecord.findMany({
    where: { premisesId, deletedAt: null },
    include: {
      vendor: true,
      lines: { include: { package: true } },
    },
    orderBy: { receivedAt: "desc" },
  });
}
