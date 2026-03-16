"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import type { DeliveryTripStatus, DeliveryStopStatus } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Delivery Flow
// Schedule trip → dispatch → en route → stops → complete trip
// ─────────────────────────────────────────────────────────────

const TERMINAL_STOP_STATUSES: DeliveryStopStatus[] = ["DELIVERED", "FAILED", "REFUSED"];

interface DeliveryStopInput {
  stopNumber: number;
  street: string;
  city: string;
  state?: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  estimatedAt?: Date;
  orderId?: string;
}

interface CreateDeliveryTripInput {
  premisesId: string;
  driverId: string;
  vehiclePlate?: string;
  vehicleDesc?: string;
  estimatedReturn?: Date;
  manifestNumber?: string;
  stops: DeliveryStopInput[];
}

async function generateTripNumber(premisesId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.deliveryTrip.count({
    where: {
      premisesId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  return `TRIP-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function createDeliveryTrip(input: CreateDeliveryTripInput) {
  const session = await requirePermission("delivery:manage");

  const driver = await db.user.findUniqueOrThrow({
    where: { id: input.driverId },
  });

  if (driver.role !== "DISPATCHER") {
    throw new Error("Assigned driver must have DISPATCHER role.");
  }

  if (!driver.isActive) {
    throw new Error("Assigned driver is not active.");
  }

  if (input.stops.length === 0) {
    throw new Error("A delivery trip must have at least one stop.");
  }

  const trip = await db.$transaction(async (tx) => {
    const tripNumber = await generateTripNumber(input.premisesId);

    const newTrip = await tx.deliveryTrip.create({
      data: {
        premisesId: input.premisesId,
        driverId: input.driverId,
        tripNumber,
        status: "SCHEDULED",
        vehiclePlate: input.vehiclePlate,
        vehicleDesc: input.vehicleDesc,
        estimatedReturn: input.estimatedReturn,
        manifestNumber: input.manifestNumber,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    for (const stop of input.stops) {
      const createdStop = await tx.deliveryStop.create({
        data: {
          tripId: newTrip.id,
          stopNumber: stop.stopNumber,
          status: "PENDING",
          street: stop.street,
          city: stop.city,
          state: stop.state ?? "CA",
          zip: stop.zip,
          latitude: stop.latitude,
          longitude: stop.longitude,
          estimatedAt: stop.estimatedAt,
        },
      });

      if (stop.orderId) {
        await tx.order.update({
          where: { id: stop.orderId },
          data: {
            deliveryStopId: createdStop.id,
            updatedBy: session.user.id,
          },
        });
      }
    }

    return newTrip;
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "DeliveryTrip",
    entityId: trip.id,
    after: {
      tripNumber: trip.tripNumber,
      driverId: input.driverId,
      manifestNumber: input.manifestNumber,
      stopCount: input.stops.length,
    },
    premisesId: input.premisesId,
  });

  return trip;
}

export async function dispatchTrip(tripId: string) {
  const session = await requirePermission("delivery:manage");

  const trip = await db.deliveryTrip.findUniqueOrThrow({
    where: { id: tripId },
  });

  if (trip.status !== "SCHEDULED") {
    throw new Error(`Cannot dispatch trip in ${trip.status} status. Must be SCHEDULED.`);
  }

  const updated = await db.deliveryTrip.update({
    where: { id: tripId },
    data: {
      status: "DISPATCHED",
      departedAt: new Date(),
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "dispatch",
    entity: "DeliveryTrip",
    entityId: tripId,
    before: { status: trip.status },
    after: { status: "DISPATCHED" },
    premisesId: trip.premisesId,
  });

  return updated;
}

export async function startRoute(tripId: string) {
  const session = await requirePermission("delivery:manage");

  const trip = await db.deliveryTrip.findUniqueOrThrow({
    where: { id: tripId },
  });

  if (trip.status !== "DISPATCHED") {
    throw new Error(`Cannot start route for trip in ${trip.status} status. Must be DISPATCHED.`);
  }

  const updated = await db.deliveryTrip.update({
    where: { id: tripId },
    data: {
      status: "EN_ROUTE",
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "start_route",
    entity: "DeliveryTrip",
    entityId: tripId,
    before: { status: trip.status },
    after: { status: "EN_ROUTE" },
    premisesId: trip.premisesId,
  });

  return updated;
}

export async function arriveAtStop(stopId: string) {
  const session = await requirePermission("delivery:manage");

  const stop = await db.deliveryStop.findUniqueOrThrow({
    where: { id: stopId },
    include: { trip: true },
  });

  if (stop.status !== "PENDING") {
    throw new Error(`Cannot arrive at stop in ${stop.status} status. Must be PENDING.`);
  }

  const updated = await db.deliveryStop.update({
    where: { id: stopId },
    data: {
      status: "ARRIVED",
      arrivedAt: new Date(),
    },
  });

  await logAuditEvent({
    session,
    action: "arrive",
    entity: "DeliveryStop",
    entityId: stopId,
    before: { status: stop.status },
    after: { status: "ARRIVED" },
    premisesId: stop.trip.premisesId,
  });

  return updated;
}

interface CompleteDeliveryInput {
  signatureUrl: string;
  idVerified: boolean;
  photoUrl?: string;
  notes?: string;
}

export async function completeDelivery(stopId: string, input: CompleteDeliveryInput) {
  const session = await requirePermission("delivery:manage");

  const stop = await db.deliveryStop.findUniqueOrThrow({
    where: { id: stopId },
    include: { trip: true },
  });

  if (stop.status !== "ARRIVED") {
    throw new Error(`Cannot complete delivery for stop in ${stop.status} status. Must be ARRIVED.`);
  }

  if (!input.signatureUrl) {
    throw new Error("Signature is required for proof of delivery.");
  }

  if (!input.idVerified) {
    throw new Error("ID verification is required for cannabis delivery.");
  }

  const updated = await db.deliveryStop.update({
    where: { id: stopId },
    data: {
      status: "DELIVERED",
      completedAt: new Date(),
      signatureUrl: input.signatureUrl,
      idVerified: input.idVerified,
      photoUrl: input.photoUrl,
      notes: input.notes,
    },
  });

  await logAuditEvent({
    session,
    action: "complete_delivery",
    entity: "DeliveryStop",
    entityId: stopId,
    before: { status: stop.status },
    after: { status: "DELIVERED", idVerified: input.idVerified },
    premisesId: stop.trip.premisesId,
  });

  return updated;
}

export async function failDelivery(stopId: string, reason: string) {
  const session = await requirePermission("delivery:manage");

  const stop = await db.deliveryStop.findUniqueOrThrow({
    where: { id: stopId },
    include: { trip: true },
  });

  const allowedStatuses: DeliveryStopStatus[] = ["PENDING", "ARRIVED"];
  if (!allowedStatuses.includes(stop.status)) {
    throw new Error(
      `Cannot fail delivery for stop in ${stop.status} status. Must be PENDING or ARRIVED.`
    );
  }

  const updated = await db.deliveryStop.update({
    where: { id: stopId },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      notes: reason,
    },
  });

  await logAuditEvent({
    session,
    action: "fail_delivery",
    entity: "DeliveryStop",
    entityId: stopId,
    before: { status: stop.status },
    after: { status: "FAILED", reason },
    premisesId: stop.trip.premisesId,
  });

  return updated;
}

export async function refuseDelivery(stopId: string, reason: string) {
  const session = await requirePermission("delivery:manage");

  const stop = await db.deliveryStop.findUniqueOrThrow({
    where: { id: stopId },
    include: { trip: true },
  });

  if (stop.status !== "ARRIVED") {
    throw new Error(`Cannot refuse delivery for stop in ${stop.status} status. Must be ARRIVED.`);
  }

  const updated = await db.deliveryStop.update({
    where: { id: stopId },
    data: {
      status: "REFUSED",
      completedAt: new Date(),
      notes: reason,
    },
  });

  await logAuditEvent({
    session,
    action: "refuse_delivery",
    entity: "DeliveryStop",
    entityId: stopId,
    before: { status: stop.status },
    after: { status: "REFUSED", reason },
    premisesId: stop.trip.premisesId,
  });

  return updated;
}

export async function completeTrip(tripId: string) {
  const session = await requirePermission("delivery:manage");

  const trip = await db.deliveryTrip.findUniqueOrThrow({
    where: { id: tripId },
    include: { stops: true },
  });

  if (trip.status !== "EN_ROUTE") {
    throw new Error(`Cannot complete trip in ${trip.status} status. Must be EN_ROUTE.`);
  }

  const unfinishedStops = trip.stops.filter((s) => !TERMINAL_STOP_STATUSES.includes(s.status));
  if (unfinishedStops.length > 0) {
    throw new Error(
      `Cannot complete trip. ${unfinishedStops.length} stop(s) are not in a terminal state.`
    );
  }

  const updated = await db.deliveryTrip.update({
    where: { id: tripId },
    data: {
      status: "COMPLETED",
      returnedAt: new Date(),
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "complete",
    entity: "DeliveryTrip",
    entityId: tripId,
    before: { status: trip.status },
    after: { status: "COMPLETED" },
    premisesId: trip.premisesId,
  });

  return updated;
}

export async function cancelTrip(tripId: string, reason: string) {
  const session = await requirePermission("delivery:manage");

  const trip = await db.deliveryTrip.findUniqueOrThrow({
    where: { id: tripId },
  });

  const cancellableStatuses: DeliveryTripStatus[] = ["SCHEDULED", "DISPATCHED"];
  if (!cancellableStatuses.includes(trip.status)) {
    throw new Error(
      `Cannot cancel trip in ${trip.status} status. Must be SCHEDULED or DISPATCHED.`
    );
  }

  const updated = await db.deliveryTrip.update({
    where: { id: tripId },
    data: {
      status: "CANCELLED",
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    session,
    action: "cancel",
    entity: "DeliveryTrip",
    entityId: tripId,
    before: { status: trip.status },
    after: { status: "CANCELLED" },
    premisesId: trip.premisesId,
    metadata: { reason },
  });

  return updated;
}

export async function getTripById(tripId: string) {
  await requirePermission("delivery:read");

  return db.deliveryTrip.findUniqueOrThrow({
    where: { id: tripId },
    include: {
      stops: {
        include: { order: true },
        orderBy: { stopNumber: "asc" },
      },
      driver: { select: { id: true, name: true, employeeId: true } },
      premises: { select: { id: true, name: true } },
    },
  });
}

export async function getTrips(
  premisesId: string,
  filters?: {
    status?: DeliveryTripStatus;
    driverId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  await requirePermission("delivery:read");

  return db.deliveryTrip.findMany({
    where: {
      premisesId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.driverId && { driverId: filters.driverId }),
      ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
      ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
    },
    include: {
      driver: { select: { id: true, name: true } },
      stops: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDriverActiveTrip(driverId: string) {
  await requirePermission("delivery:read");

  return db.deliveryTrip.findFirst({
    where: {
      driverId,
      status: { in: ["DISPATCHED", "EN_ROUTE"] },
      deletedAt: null,
    },
    include: {
      stops: {
        include: { order: true },
        orderBy: { stopNumber: "asc" },
      },
      premises: { select: { id: true, name: true } },
    },
  });
}
