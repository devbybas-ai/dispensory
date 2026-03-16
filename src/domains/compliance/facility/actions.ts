"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";

// ─────────────────────────────────────────────────────────────
// Facility Management: Rooms/Zones & Inventory Locations
// ─────────────────────────────────────────────────────────────

// === Rooms ===

interface CreateRoomInput {
  premisesId: string;
  name: string;
  type: string;
  isLimitedAccess?: boolean;
  hasSurveillance?: boolean;
}

export async function createRoom(input: CreateRoomInput) {
  const session = await requirePermission("compliance:write");

  const room = await db.room.create({
    data: {
      premisesId: input.premisesId,
      name: input.name,
      type: input.type,
      isLimitedAccess: input.isLimitedAccess ?? false,
      hasSurveillance: input.hasSurveillance ?? false,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "Room",
    entityId: room.id,
    after: room,
    premisesId: input.premisesId,
  });

  return room;
}

interface UpdateRoomInput {
  id: string;
  name?: string;
  type?: string;
  isLimitedAccess?: boolean;
  hasSurveillance?: boolean;
}

export async function updateRoom(input: UpdateRoomInput) {
  const session = await requirePermission("compliance:write");

  const before = await db.room.findUniqueOrThrow({ where: { id: input.id } });

  const room = await db.room.update({
    where: { id: input.id },
    data: {
      name: input.name,
      type: input.type,
      isLimitedAccess: input.isLimitedAccess,
      hasSurveillance: input.hasSurveillance,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "update",
    entity: "Room",
    entityId: room.id,
    before,
    after: room,
    premisesId: room.premisesId,
  });

  return room;
}

export async function getRoomsByPremises(premisesId: string) {
  await requirePermission("compliance:read");

  return db.room.findMany({
    where: { premisesId, deletedAt: null },
    include: { inventoryLocations: { where: { deletedAt: null } } },
    orderBy: { name: "asc" },
  });
}

// === Inventory Locations ===

interface CreateLocationInput {
  premisesId: string;
  roomId?: string;
  name: string;
  barcode?: string;
}

export async function createInventoryLocation(input: CreateLocationInput) {
  const session = await requirePermission("compliance:write");

  const location = await db.inventoryLocation.create({
    data: {
      premisesId: input.premisesId,
      roomId: input.roomId,
      name: input.name,
      barcode: input.barcode,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "InventoryLocation",
    entityId: location.id,
    after: location,
    premisesId: input.premisesId,
  });

  return location;
}

interface UpdateLocationInput {
  id: string;
  name?: string;
  roomId?: string;
  barcode?: string;
  isActive?: boolean;
}

export async function updateInventoryLocation(input: UpdateLocationInput) {
  const session = await requirePermission("compliance:write");

  const before = await db.inventoryLocation.findUniqueOrThrow({
    where: { id: input.id },
  });

  const location = await db.inventoryLocation.update({
    where: { id: input.id },
    data: {
      name: input.name,
      roomId: input.roomId,
      barcode: input.barcode,
      isActive: input.isActive,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "update",
    entity: "InventoryLocation",
    entityId: location.id,
    before,
    after: location,
    premisesId: location.premisesId,
  });

  return location;
}

export async function getLocationsByPremises(premisesId: string) {
  await requirePermission("compliance:read");

  return db.inventoryLocation.findMany({
    where: { premisesId, deletedAt: null },
    include: { room: true },
    orderBy: { name: "asc" },
  });
}
