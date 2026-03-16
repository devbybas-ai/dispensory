import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLocalRuleValue } from "@/domains/compliance/local-rules/actions";
import { POSTerminal } from "./_components/pos-terminal";

export const metadata = {
  title: "Point of Sale",
};

export default async function POSPage() {
  const session = await auth();
  if (!session?.user?.premisesId) {
    redirect("/login");
  }

  const premisesId = session.user.premisesId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [recentOrders, availableProducts, activeShift, todayStats, localTaxRate] =
    await Promise.all([
      db.order.findMany({
        where: { premisesId, deletedAt: null },
        include: {
          customer: { select: { firstName: true, lastName: true, type: true } },
          cashier: { select: { name: true } },
          payments: { select: { method: true, amount: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.package.findMany({
        where: {
          deletedAt: null,
          state: "AVAILABLE",
          isOnHold: false,
          location: { premisesId },
          batch: {
            testingStatus: "PASSED",
            productMaster: { complianceStatus: "APPROVED" },
          },
        },
        include: {
          batch: { include: { productMaster: true } },
        },
        orderBy: {
          batch: { productMaster: { name: "asc" } },
        },
      }),
      db.shift.findFirst({
        where: {
          userId: session.user.id,
          premisesId,
          status: "OPEN",
        },
        include: { cashDrawers: true },
      }),
      db.order.aggregate({
        where: {
          premisesId,
          status: "COMPLETED",
          completedAt: { gte: today },
        },
        _count: true,
        _sum: { totalAmount: true },
      }),
      getLocalRuleValue(premisesId, "local_cannabis_tax_rate", "0"),
    ]);

  // Serialize data for the client component (Dates -> strings, Decimals -> numbers)
  const serializedProducts = availableProducts.map((pkg) => ({
    packageId: pkg.id,
    productName: pkg.batch.productMaster.name,
    brand: pkg.batch.productMaster.brand ?? "",
    category: pkg.batch.productMaster.category.replace(/_/g, " "),
    metrcUid: pkg.metrcUid,
    unitPrice: Number(pkg.batch.productMaster.unitPrice ?? 0),
    maxQuantity: Number(pkg.quantity),
    thcPercent: pkg.batch.thcPercent ? Number(pkg.batch.thcPercent) : null,
  }));

  const serializedOrders = recentOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : null,
    type: order.type,
    lineCount: order._count.lines,
    totalAmount: Number(order.totalAmount),
    paymentMethod: order.payments[0]?.method ?? null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  const serializedShift = activeShift
    ? {
        id: activeShift.id,
        startedAt: activeShift.startedAt.toISOString(),
        drawerCount: activeShift.cashDrawers.length,
      }
    : null;

  const taxConfig = {
    localCannabisTaxRate: parseFloat(localTaxRate),
  };

  return (
    <POSTerminal
      availableProducts={serializedProducts}
      recentOrders={serializedOrders}
      activeShift={serializedShift}
      todayStats={{
        orderCount: todayStats._count,
        revenue: Number(todayStats._sum.totalAmount ?? 0),
      }}
      premisesId={premisesId}
      taxConfig={taxConfig}
    />
  );
}
