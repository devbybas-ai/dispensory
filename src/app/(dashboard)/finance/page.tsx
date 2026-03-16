import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, DollarSign, Receipt, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Finance",
};

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user?.premisesId) {
    redirect("/login");
  }

  const premisesId = session.user.premisesId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Current month boundaries
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [todaySales, monthSales, taxSummary, paymentBreakdown, recentShifts] = await Promise.all([
    db.order.aggregate({
      where: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: today, lt: tomorrow },
      },
      _count: true,
      _sum: { subtotal: true, totalTax: true, totalAmount: true },
    }),
    db.order.aggregate({
      where: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: monthStart, lt: monthEnd },
      },
      _count: true,
      _sum: { subtotal: true, totalTax: true, totalAmount: true },
    }),
    db.taxLine.groupBy({
      by: ["taxType"],
      where: {
        order: {
          premisesId,
          status: "COMPLETED",
          completedAt: { gte: monthStart, lt: monthEnd },
        },
      },
      _sum: { taxableAmount: true, taxAmount: true },
    }),
    db.payment.groupBy({
      by: ["method"],
      where: {
        status: "COMPLETED",
        order: {
          premisesId,
          status: "COMPLETED",
          completedAt: { gte: monthStart, lt: monthEnd },
        },
      },
      _sum: { amount: true },
      _count: true,
    }),
    db.shift.findMany({
      where: { premisesId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
  ]);

  const TAX_LABELS: Record<string, string> = {
    EXCISE_TAX: "Cannabis Excise Tax (15%)",
    SALES_TAX: "Sales Tax",
    LOCAL_CANNABIS_TAX: "Local Cannabis Tax",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">
          Revenue reports, tax summaries, and shift reconciliation
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <DollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(todaySales._sum.totalAmount ?? 0).toFixed(2)}
            </div>
            <p className="text-muted-foreground text-sm">{todaySales._count} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Tax Collected</CardTitle>
            <Receipt className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(todaySales._sum.totalTax ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Month Revenue</CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(monthSales._sum.totalAmount ?? 0).toFixed(2)}
            </div>
            <p className="text-muted-foreground text-sm">{monthSales._count} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Month Tax Collected</CardTitle>
            <BarChart3 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(monthSales._sum.totalTax ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Breakdown for CDTFA */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Tax Summary (CDTFA)</CardTitle>
          <CardDescription>
            Tax breakdown by type for{" "}
            {monthStart.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
            . Used for monthly electronic filing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Type</TableHead>
                <TableHead className="text-right">Taxable Amount</TableHead>
                <TableHead className="text-right">Tax Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center">
                    No tax data for this period
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {taxSummary.map((tax) => (
                    <TableRow key={tax.taxType}>
                      <TableCell className="font-medium">
                        {TAX_LABELS[tax.taxType] ?? tax.taxType}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Number(tax._sum.taxableAmount ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(tax._sum.taxAmount ?? 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      $
                      {taxSummary
                        .reduce((sum, t) => sum + Number(t._sum.taxableAmount ?? 0), 0)
                        .toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      $
                      {taxSummary
                        .reduce((sum, t) => sum + Number(t._sum.taxAmount ?? 0), 0)
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Breakdown</CardTitle>
          <CardDescription>Month-to-date payment method distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center">
                    No payments for this period
                  </TableCell>
                </TableRow>
              ) : (
                paymentBreakdown.map((p) => (
                  <TableRow key={p.method}>
                    <TableCell className="font-medium">{p.method}</TableCell>
                    <TableCell className="text-right">{p._count}</TableCell>
                    <TableCell className="text-right">
                      ${Number(p._sum.amount ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Shifts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Shifts</CardTitle>
          <CardDescription>Shift reconciliation history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Ended</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                recentShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.user.name}</TableCell>
                    <TableCell>
                      <span className={shift.status === "OPEN" ? "font-medium text-green-600" : ""}>
                        {shift.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {shift.startedAt.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {shift.endedAt
                        ? shift.endedAt.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {shift.expectedCash != null
                        ? `$${Number(shift.expectedCash).toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {shift.actualCash != null ? `$${Number(shift.actualCash).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {shift.variance != null ? (
                        <span
                          className={
                            Number(shift.variance) !== 0 ? "text-destructive font-medium" : ""
                          }
                        >
                          ${Number(shift.variance).toFixed(2)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
