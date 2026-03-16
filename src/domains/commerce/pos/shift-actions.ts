"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import { emitPOSEvent } from "@/lib/realtime/emit";

// ─────────────────────────────────────────────────────────────
// Shift & Cash Drawer Management
// ─────────────────────────────────────────────────────────────

/** Open a new shift for the current user. */
export async function openShift(premisesId: string) {
  const session = await requirePermission("pos:sell");

  // Check for existing open shift
  const existing = await db.shift.findFirst({
    where: {
      userId: session.user.id,
      premisesId,
      status: "OPEN",
    },
  });
  if (existing) {
    throw new Error("You already have an open shift. Close it before opening a new one.");
  }

  const shift = await db.shift.create({
    data: {
      premisesId,
      userId: session.user.id,
      status: "OPEN",
    },
  });

  await logAuditEvent({
    session,
    action: "open_shift",
    entity: "Shift",
    entityId: shift.id,
    premisesId,
  });

  await emitPOSEvent(premisesId, "shift:opened", { shiftId: shift.id });

  return shift;
}

/** Close the current shift. */
export async function closeShift(shiftId: string) {
  const session = await requirePermission("pos:sell");

  const shift = await db.shift.findUniqueOrThrow({
    where: { id: shiftId },
  });

  if (shift.status !== "OPEN") {
    throw new Error("Shift is not open.");
  }

  const updated = await db.shift.update({
    where: { id: shiftId },
    data: {
      status: "CLOSED",
      endedAt: new Date(),
    },
  });

  await logAuditEvent({
    session,
    action: "close_shift",
    entity: "Shift",
    entityId: shiftId,
    premisesId: shift.premisesId,
  });

  await emitPOSEvent(shift.premisesId, "shift:closed", { shiftId: shift.id });

  return updated;
}

/** Reconcile a shift with cash count (requires MANAGER). */
export async function reconcileShift(shiftId: string, actualCash: number) {
  const session = await requirePermission("pos:void");

  const shift = await db.shift.findUniqueOrThrow({
    where: { id: shiftId },
    include: {
      cashDrawers: true,
    },
  });

  if (shift.status !== "CLOSED") {
    throw new Error("Shift must be closed before reconciliation.");
  }

  // Calculate expected cash from drawers
  const expectedCash = shift.cashDrawers.reduce((sum, d) => {
    return (
      sum + Number(d.openingBalance) + (Number(d.closingBalance ?? 0) - Number(d.openingBalance))
    );
  }, 0);

  const variance = Math.round((actualCash - expectedCash) * 100) / 100;

  const updated = await db.shift.update({
    where: { id: shiftId },
    data: {
      status: "RECONCILED",
      expectedCash,
      actualCash,
      variance,
      reconciledBy: session.user.id,
      reconciledAt: new Date(),
    },
  });

  await logAuditEvent({
    session,
    action: "reconcile_shift",
    entity: "Shift",
    entityId: shiftId,
    after: { expectedCash, actualCash, variance },
    premisesId: shift.premisesId,
  });

  return updated;
}

/** Open a cash drawer for a shift. */
export async function openCashDrawer(shiftId: string, register: string, openingBalance: number) {
  const session = await requirePermission("pos:sell");

  const drawer = await db.cashDrawer.create({
    data: {
      shiftId,
      userId: session.user.id,
      register,
      openingBalance,
      status: "OPEN",
    },
  });

  await logAuditEvent({
    session,
    action: "open_drawer",
    entity: "CashDrawer",
    entityId: drawer.id,
    metadata: { register, openingBalance },
  });

  return drawer;
}

/** Close and count a cash drawer. */
export async function closeCashDrawer(drawerId: string, closingBalance: number) {
  const session = await requirePermission("pos:sell");

  const drawer = await db.cashDrawer.update({
    where: { id: drawerId },
    data: {
      status: "COUNTED",
      closingBalance,
      closedAt: new Date(),
      countedAt: new Date(),
    },
  });

  await logAuditEvent({
    session,
    action: "close_drawer",
    entity: "CashDrawer",
    entityId: drawerId,
    after: { closingBalance },
  });

  return drawer;
}

/** Get current open shift for a user. */
export async function getOpenShift(premisesId: string) {
  const session = await requirePermission("pos:read");

  return db.shift.findFirst({
    where: {
      userId: session.user.id,
      premisesId,
      status: "OPEN",
    },
    include: { cashDrawers: true },
  });
}
