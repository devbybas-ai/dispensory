"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logAuditEvent } from "@/domains/compliance/audit/log-audit";
import { emitPOSEvent } from "@/lib/realtime/emit";
import { calculateTaxLines, sumTaxLines, type TaxConfig } from "@/domains/finance/tax/tax-engine";
import { getLocalRuleValue } from "@/domains/compliance/local-rules/actions";
import type { CustomerType, PaymentMethod } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// POS Checkout Flow
// Cart → validation → tax → payment → receipt → audit
// ─────────────────────────────────────────────────────────────

interface CartLineInput {
  packageId: string;
  quantity: number;
}

interface CreateOrderInput {
  premisesId: string;
  customerId?: string;
  type: CustomerType;
  lines: CartLineInput[];
}

/** Generate a sequential order number for a premises. */
async function generateOrderNumber(premisesId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.order.count({
    where: {
      premisesId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  return `ORD-${year}-${String(count + 1).padStart(5, "0")}`;
}

/** Get tax config for a premises (using local rules). */
async function getTaxConfigForPremises(premisesId: string): Promise<Partial<TaxConfig>> {
  const localRate = await getLocalRuleValue(premisesId, "local_cannabis_tax_rate", "0");

  return {
    localCannabisTaxRate: parseFloat(localRate),
  };
}

/**
 * Create a new order (draft) with validated cart lines.
 * Validates: package availability, quantity, customer eligibility.
 */
export async function createOrder(input: CreateOrderInput) {
  const session = await requirePermission("pos:sell");

  // Validate customer if provided
  if (input.customerId) {
    const customer = await db.customer.findUniqueOrThrow({
      where: { id: input.customerId },
      include: { patientRecord: true },
    });

    // Age re-verification
    if (!customer.idVerified) {
      throw new Error("Customer ID must be verified before purchase.");
    }
  }

  // Validate and calculate line totals
  let subtotal = 0;
  const orderLines: {
    packageId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];

  for (const line of input.lines) {
    const pkg = await db.package.findUniqueOrThrow({
      where: { id: line.packageId },
      include: { batch: { include: { productMaster: true } } },
    });

    // Validate package is available for sale
    if (pkg.state !== "AVAILABLE") {
      throw new Error(`Package ${pkg.metrcUid} is not available (state: ${pkg.state}).`);
    }

    if (pkg.isOnHold) {
      throw new Error(`Package ${pkg.metrcUid} is on hold: ${pkg.holdReason}`);
    }

    // Validate quantity
    if (line.quantity > Number(pkg.quantity)) {
      throw new Error(
        `Insufficient quantity for ${pkg.metrcUid}. Available: ${pkg.quantity}, Requested: ${line.quantity}`
      );
    }

    // Validate lab test passed (cannabis products)
    if (pkg.batch.productMaster.requiresLabTest && pkg.batch.testingStatus !== "PASSED") {
      throw new Error(
        `Package ${pkg.metrcUid} has not passed lab testing (status: ${pkg.batch.testingStatus}).`
      );
    }

    // Validate compliance status
    if (pkg.batch.productMaster.complianceStatus !== "APPROVED") {
      throw new Error(`Product "${pkg.batch.productMaster.name}" is not approved for sale.`);
    }

    const unitPrice = Number(pkg.batch.productMaster.unitPrice ?? 0);
    const lineTotal = Math.round(unitPrice * line.quantity * 100) / 100;
    subtotal += lineTotal;

    orderLines.push({
      packageId: line.packageId,
      productName: pkg.batch.productMaster.name,
      quantity: line.quantity,
      unitPrice,
      lineTotal,
    });
  }

  // Calculate taxes
  const taxConfig = await getTaxConfigForPremises(input.premisesId);
  const taxLines = calculateTaxLines(subtotal, taxConfig);
  const totalTax = sumTaxLines(taxLines);
  const totalAmount = Math.round((subtotal + totalTax) * 100) / 100;

  // Create order in a transaction
  const order = await db.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(input.premisesId);

    const newOrder = await tx.order.create({
      data: {
        premisesId: input.premisesId,
        customerId: input.customerId,
        cashierId: session.user.id,
        orderNumber,
        status: "DRAFT",
        type: input.type,
        subtotal,
        totalTax,
        totalAmount,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Create order lines
    for (const line of orderLines) {
      await tx.orderLine.create({
        data: {
          orderId: newOrder.id,
          packageId: line.packageId,
          productName: line.productName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        },
      });

      // Reserve inventory
      await tx.package.update({
        where: { id: line.packageId },
        data: {
          state: "RESERVED",
          quantity: { decrement: line.quantity },
          updatedBy: session.user.id,
        },
      });

      await tx.inventoryAdjustment.create({
        data: {
          packageId: line.packageId,
          reason: "SOLD",
          fromState: "AVAILABLE",
          toState: "RESERVED",
          quantityBefore: 0, // Will be calculated at runtime
          quantityAfter: 0,
          quantityDelta: -line.quantity,
          adjustedBy: session.user.id,
        },
      });
    }

    // Create tax lines
    for (const tax of taxLines) {
      await tx.taxLine.create({
        data: {
          orderId: newOrder.id,
          taxType: tax.taxType,
          taxRate: tax.taxRate,
          taxableAmount: tax.taxableAmount,
          taxAmount: tax.taxAmount,
          description: tax.description,
        },
      });
    }

    return newOrder;
  });

  await logAuditEvent({
    session,
    action: "create",
    entity: "Order",
    entityId: order.id,
    after: {
      orderNumber: order.orderNumber,
      subtotal,
      totalTax,
      totalAmount,
      lineCount: orderLines.length,
    },
    premisesId: input.premisesId,
  });

  await emitPOSEvent(input.premisesId, "order:created", { orderNumber: order.orderNumber });

  return order;
}

interface ProcessPaymentInput {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  tendered?: number; // Cash payments
  transactionRef?: string; // Card/ACH payments
}

/** Process payment and complete the order. */
export async function processPayment(input: ProcessPaymentInput) {
  const session = await requirePermission("pos:sell");

  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
    include: { lines: true },
  });

  if (order.status !== "DRAFT" && order.status !== "PENDING") {
    throw new Error(`Order ${order.orderNumber} is not in a payable state.`);
  }

  const totalDue = Number(order.totalAmount);
  if (input.amount < totalDue) {
    throw new Error(`Payment amount ${input.amount} is less than total due ${totalDue}.`);
  }

  // Calculate change for cash payments
  const change =
    input.method === "CASH" && input.tendered
      ? Math.round((input.tendered - totalDue) * 100) / 100
      : undefined;

  const completedOrder = await db.$transaction(async (tx) => {
    // Create payment record
    await tx.payment.create({
      data: {
        orderId: input.orderId,
        method: input.method,
        status: "COMPLETED",
        amount: totalDue,
        tendered: input.tendered,
        change,
        transactionRef: input.transactionRef,
        processedAt: new Date(),
      },
    });

    // Complete the order
    const updated = await tx.order.update({
      where: { id: input.orderId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    return updated;
  });

  await logAuditEvent({
    session,
    action: "payment",
    entity: "Order",
    entityId: input.orderId,
    after: {
      orderNumber: order.orderNumber,
      method: input.method,
      amount: totalDue,
      status: "COMPLETED",
    },
    premisesId: order.premisesId,
  });

  await emitPOSEvent(order.premisesId, "order:completed", { orderNumber: order.orderNumber });

  return completedOrder;
}

/** Void an order (requires MANAGER+ role). */
export async function voidOrder(orderId: string, voidReason: string) {
  const session = await requirePermission("pos:void");

  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { lines: true },
  });

  if (order.status === "VOIDED") {
    throw new Error("Order is already voided.");
  }

  const voidedOrder = await db.$transaction(async (tx) => {
    // Restore inventory for each line
    for (const line of order.lines) {
      await tx.package.update({
        where: { id: line.packageId },
        data: {
          state: "AVAILABLE",
          quantity: { increment: Number(line.quantity) },
          updatedBy: session.user.id,
        },
      });

      await tx.inventoryAdjustment.create({
        data: {
          packageId: line.packageId,
          reason: "RETURNED_BY_CUSTOMER",
          note: `Order ${order.orderNumber} voided: ${voidReason}`,
          fromState: "RESERVED",
          toState: "AVAILABLE",
          quantityBefore: 0,
          quantityAfter: 0,
          quantityDelta: Number(line.quantity),
          adjustedBy: session.user.id,
        },
      });
    }

    // Void the order
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        voidReason,
        updatedBy: session.user.id,
      },
    });
  });

  await logAuditEvent({
    session,
    action: "void",
    entity: "Order",
    entityId: orderId,
    before: { status: order.status },
    after: { status: "VOIDED", voidReason },
    premisesId: order.premisesId,
  });

  await emitPOSEvent(order.premisesId, "order:voided", { orderNumber: order.orderNumber });

  return voidedOrder;
}

/** Get order details with all related data. */
export async function getOrderById(orderId: string) {
  await requirePermission("pos:read");

  return db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      lines: { include: { package: true } },
      taxLines: true,
      payments: true,
      customer: true,
      cashier: { select: { id: true, name: true, employeeId: true } },
    },
  });
}

/** Get orders for a premises, optionally filtered. */
export async function getOrders(
  premisesId: string,
  filters?: {
    status?: string;
    cashierId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  await requirePermission("pos:read");

  return db.order.findMany({
    where: {
      premisesId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status as never }),
      ...(filters?.cashierId && { cashierId: filters.cashierId }),
      ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
      ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      cashier: { select: { id: true, name: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
