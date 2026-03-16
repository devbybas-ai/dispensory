"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";

// ─────────────────────────────────────────────────────────────
// Finance Reporting
// CDTFA compliance: sales tax, excise tax, local cannabis tax
// All monetary values converted from Decimal to number
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────

interface PaymentBreakdown {
  method: string;
  count: number;
  total: number;
}

interface CustomerTypeBreakdown {
  type: string;
  count: number;
  revenue: number;
}

interface DailySalesReport {
  date: string;
  premisesId: string;
  totalOrders: number;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  averageOrderValue: number;
  voidCount: number;
  voidedAmount: number;
  returnCount: number;
  paymentBreakdown: PaymentBreakdown[];
  customerTypeBreakdown: CustomerTypeBreakdown[];
}

interface TaxTypeSummary {
  taxType: string;
  totalTaxableAmount: number;
  totalTaxCollected: number;
  taxRate: number;
}

interface TaxReport {
  premisesId: string;
  startDate: string;
  endDate: string;
  taxSummaries: TaxTypeSummary[];
  periodTotalTaxable: number;
  periodTotalTaxCollected: number;
}

interface ShiftReportPayment {
  method: string;
  count: number;
  total: number;
}

interface ShiftReport {
  shiftId: string;
  userId: string;
  userName: string;
  premisesId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  ordersProcessed: number;
  totalRevenue: number;
  paymentBreakdown: ShiftReportPayment[];
  expectedCash: number | null;
  actualCash: number | null;
  variance: number | null;
  drawerActivity: DrawerActivity[];
}

interface DrawerActivity {
  drawerId: string;
  register: string;
  status: string;
  openingBalance: number;
  closingBalance: number | null;
  openedAt: string;
  closedAt: string | null;
}

interface SalesHistoryFilters {
  dateFrom?: Date;
  dateTo?: Date;
  cashierId?: string;
  paymentMethod?: string;
  customerType?: string;
  page?: number;
  pageSize?: number;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  discount: number;
  cashierName: string;
  customerName: string | null;
  paymentMethod: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface SalesHistoryResult {
  orders: OrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface DailyRevenue {
  date: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Get start-of-day boundary for a date. */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get end-of-day boundary for a date. */
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Safely convert a Prisma Decimal or null to number. */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** Format date as YYYY-MM-DD string. */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// 1. Daily Sales Report
// ─────────────────────────────────────────────────────────────

/** Daily sales summary for a premises. */
export async function getDailySalesReport(
  premisesId: string,
  date: Date
): Promise<DailySalesReport> {
  await requirePermission("finance:read");

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Completed orders aggregate
  const completedAgg = await db.order.aggregate({
    where: {
      premisesId,
      status: "COMPLETED",
      completedAt: { gte: dayStart, lte: dayEnd },
      deletedAt: null,
    },
    _count: { id: true },
    _sum: {
      subtotal: true,
      totalTax: true,
      totalAmount: true,
    },
  });

  const totalOrders = completedAgg._count.id;
  const subtotal = toNumber(completedAgg._sum.subtotal);
  const totalTax = toNumber(completedAgg._sum.totalTax);
  const grandTotal = toNumber(completedAgg._sum.totalAmount);
  const averageOrderValue =
    totalOrders > 0 ? Math.round((grandTotal / totalOrders) * 100) / 100 : 0;

  // Voided orders
  const voidedAgg = await db.order.aggregate({
    where: {
      premisesId,
      status: "VOIDED",
      voidedAt: { gte: dayStart, lte: dayEnd },
      deletedAt: null,
    },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  const voidCount = voidedAgg._count.id;
  const voidedAmount = toNumber(voidedAgg._sum.totalAmount);

  // Returns count
  const returnCount = await db.order.count({
    where: {
      premisesId,
      status: "RETURNED",
      updatedAt: { gte: dayStart, lte: dayEnd },
      deletedAt: null,
    },
  });

  // Payment breakdown - group completed payments by method
  const paymentGroups = await db.payment.groupBy({
    by: ["method"],
    where: {
      order: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: dayStart, lte: dayEnd },
        deletedAt: null,
      },
      status: "COMPLETED",
    },
    _count: { id: true },
    _sum: { amount: true },
  });

  const paymentBreakdown: PaymentBreakdown[] = paymentGroups.map((group) => ({
    method: group.method,
    count: group._count.id,
    total: toNumber(group._sum.amount),
  }));

  // Customer type breakdown
  const typeGroups = await db.order.groupBy({
    by: ["type"],
    where: {
      premisesId,
      status: "COMPLETED",
      completedAt: { gte: dayStart, lte: dayEnd },
      deletedAt: null,
    },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  const customerTypeBreakdown: CustomerTypeBreakdown[] = typeGroups.map((group) => ({
    type: group.type,
    count: group._count.id,
    revenue: toNumber(group._sum.totalAmount),
  }));

  return {
    date: dayStart.toISOString().slice(0, 10),
    premisesId,
    totalOrders,
    subtotal,
    totalTax,
    grandTotal,
    averageOrderValue,
    voidCount,
    voidedAmount,
    returnCount,
    paymentBreakdown,
    customerTypeBreakdown,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. Tax Report (CDTFA Filing)
// ─────────────────────────────────────────────────────────────

/** Tax report grouped by tax type for CDTFA electronic filing. */
export async function getTaxReport(
  premisesId: string,
  startDate: Date,
  endDate: Date
): Promise<TaxReport> {
  await requirePermission("finance:read");

  const periodStart = startOfDay(startDate);
  const periodEnd = endOfDay(endDate);

  // Group tax lines by type for completed orders in the period
  const taxGroups = await db.taxLine.groupBy({
    by: ["taxType"],
    where: {
      order: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: periodStart, lte: periodEnd },
        deletedAt: null,
      },
    },
    _sum: {
      taxableAmount: true,
      taxAmount: true,
    },
  });

  // Get the average tax rate per type (rates should be consistent within a period,
  // but we compute the effective rate from totals for accuracy)
  const taxSummaries: TaxTypeSummary[] = [];
  let periodTotalTaxable = 0;
  let periodTotalTaxCollected = 0;

  for (const group of taxGroups) {
    const totalTaxable = toNumber(group._sum.taxableAmount);
    const totalCollected = toNumber(group._sum.taxAmount);
    const effectiveRate =
      totalTaxable > 0 ? Math.round((totalCollected / totalTaxable) * 10000) / 10000 : 0;

    taxSummaries.push({
      taxType: group.taxType,
      totalTaxableAmount: totalTaxable,
      totalTaxCollected: totalCollected,
      taxRate: effectiveRate,
    });

    periodTotalTaxable += totalTaxable;
    periodTotalTaxCollected += totalCollected;
  }

  return {
    premisesId,
    startDate: periodStart.toISOString().slice(0, 10),
    endDate: periodEnd.toISOString().slice(0, 10),
    taxSummaries,
    periodTotalTaxable: Math.round(periodTotalTaxable * 100) / 100,
    periodTotalTaxCollected: Math.round(periodTotalTaxCollected * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────
// 3. Shift Report
// ─────────────────────────────────────────────────────────────

/** Shift reconciliation report with payment breakdown and drawer activity. */
export async function getShiftReport(shiftId: string): Promise<ShiftReport> {
  await requirePermission("finance:read");

  const shift = await db.shift.findUniqueOrThrow({
    where: { id: shiftId },
    include: {
      user: { select: { id: true, name: true } },
      cashDrawers: true,
    },
  });

  // Orders completed during this shift's time window
  const shiftStart = shift.startedAt;
  const shiftEnd = shift.endedAt ?? new Date();

  const orders = await db.order.findMany({
    where: {
      premisesId: shift.premisesId,
      cashierId: shift.userId,
      status: "COMPLETED",
      completedAt: { gte: shiftStart, lte: shiftEnd },
      deletedAt: null,
    },
    include: { payments: true },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);

  // Payment breakdown for the shift
  const paymentMap = new Map<string, { count: number; total: number }>();
  for (const order of orders) {
    for (const payment of order.payments) {
      if (payment.status !== "COMPLETED") continue;
      const existing = paymentMap.get(payment.method) ?? { count: 0, total: 0 };
      existing.count += 1;
      existing.total += toNumber(payment.amount);
      paymentMap.set(payment.method, existing);
    }
  }

  const paymentBreakdown: ShiftReportPayment[] = Array.from(paymentMap.entries()).map(
    ([method, data]) => ({
      method,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    })
  );

  // Drawer activity
  const drawerActivity: DrawerActivity[] = shift.cashDrawers.map((drawer) => ({
    drawerId: drawer.id,
    register: drawer.register,
    status: drawer.status,
    openingBalance: toNumber(drawer.openingBalance),
    closingBalance: drawer.closingBalance !== null ? toNumber(drawer.closingBalance) : null,
    openedAt: drawer.openedAt.toISOString(),
    closedAt: drawer.closedAt?.toISOString() ?? null,
  }));

  return {
    shiftId: shift.id,
    userId: shift.userId,
    userName: shift.user.name,
    premisesId: shift.premisesId,
    status: shift.status,
    startedAt: shift.startedAt.toISOString(),
    endedAt: shift.endedAt?.toISOString() ?? null,
    ordersProcessed: orders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    paymentBreakdown,
    expectedCash: shift.expectedCash !== null ? toNumber(shift.expectedCash) : null,
    actualCash: shift.actualCash !== null ? toNumber(shift.actualCash) : null,
    variance: shift.variance !== null ? toNumber(shift.variance) : null,
    drawerActivity,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. Sales History (paginated, filtered)
// ─────────────────────────────────────────────────────────────

/** Paginated sales history with filters for date, cashier, payment method, customer type. */
export async function getSalesHistory(
  premisesId: string,
  filters?: SalesHistoryFilters
): Promise<SalesHistoryResult> {
  await requirePermission("finance:read");

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  // Build date range filter
  const dateFilter: Record<string, Date> = {};
  if (filters?.dateFrom) {
    dateFilter.gte = startOfDay(filters.dateFrom);
  }
  if (filters?.dateTo) {
    dateFilter.lte = endOfDay(filters.dateTo);
  }

  // Build where clause
  const where: Record<string, unknown> = {
    premisesId,
    deletedAt: null,
    ...(filters?.cashierId && { cashierId: filters.cashierId }),
    ...(filters?.customerType && { type: filters.customerType }),
    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
  };

  // Payment method filter requires a relation filter
  if (filters?.paymentMethod) {
    where.payments = {
      some: {
        method: filters.paymentMethod,
        status: "COMPLETED",
      },
    };
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
        payments: {
          where: { status: "COMPLETED" },
          select: { method: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.order.count({ where }),
  ]);

  const orderSummaries: OrderSummary[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    type: order.type,
    subtotal: toNumber(order.subtotal),
    totalTax: toNumber(order.totalTax),
    totalAmount: toNumber(order.totalAmount),
    discount: toNumber(order.discount),
    cashierName: order.cashier.name,
    customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : null,
    paymentMethod: order.payments[0]?.method ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
  }));

  return {
    orders: orderSummaries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Top Products
// ─────────────────────────────────────────────────────────────

/** Top selling products by revenue for a date range. */
export async function getTopProducts(
  premisesId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<TopProduct[]> {
  await requirePermission("finance:read");

  const periodStart = startOfDay(startDate);
  const periodEnd = endOfDay(endDate);

  // Group order lines by product name for completed orders
  const topProducts = await db.orderLine.groupBy({
    by: ["productName"],
    where: {
      order: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: periodStart, lte: periodEnd },
        deletedAt: null,
      },
    },
    _sum: {
      quantity: true,
      lineTotal: true,
    },
    orderBy: {
      _sum: {
        lineTotal: "desc",
      },
    },
    take: limit,
  });

  return topProducts.map((product) => ({
    productName: product.productName,
    totalQuantity: toNumber(product._sum.quantity),
    totalRevenue: toNumber(product._sum.lineTotal),
  }));
}

// ─────────────────────────────────────────────────────────────
// 6. Revenue by Day (chart data)
// ─────────────────────────────────────────────────────────────

/** Daily revenue aggregation for dashboard charts. */
export async function getRevenueByDay(
  premisesId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyRevenue[]> {
  await requirePermission("finance:read");

  const periodStart = startOfDay(startDate);
  const periodEnd = endOfDay(endDate);

  // Prisma doesn't support groupBy on date truncation, so use raw SQL
  const rows = await db.$queryRaw<
    {
      date: Date;
      total_revenue: number | string;
      order_count: bigint;
    }[]
  >`
    SELECT
      DATE("completedAt") as date,
      SUM("totalAmount"::numeric) as total_revenue,
      COUNT(*)::bigint as order_count
    FROM "Order"
    WHERE "premisesId" = ${premisesId}
      AND "status" = 'COMPLETED'
      AND "completedAt" >= ${periodStart}
      AND "completedAt" <= ${periodEnd}
      AND "deletedAt" IS NULL
    GROUP BY DATE("completedAt")
    ORDER BY DATE("completedAt") ASC
  `;

  return rows.map((row) => {
    const totalRevenue = Math.round(Number(row.total_revenue) * 100) / 100;
    const orderCount = Number(row.order_count);
    const averageOrderValue =
      orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0;

    return {
      date: formatDate(new Date(row.date)),
      totalRevenue,
      orderCount,
      averageOrderValue,
    };
  });
}
