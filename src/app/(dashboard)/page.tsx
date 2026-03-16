import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Package, ShoppingCart, AlertTriangle, DollarSign, Users } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

async function getDashboardData(premisesId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    licenseCount,
    expiringLicenses,
    availablePackages,
    quarantinedPackages,
    todayOrders,
    todayRevenue,
    activeVendors,
  ] = await Promise.all([
    db.license.count({
      where: { premisesId, deletedAt: null, status: "ACTIVE" },
    }),
    db.license.count({
      where: {
        premisesId,
        deletedAt: null,
        status: "ACTIVE",
        expiresAt: {
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    db.package.count({
      where: {
        deletedAt: null,
        state: "AVAILABLE",
        location: { premisesId },
      },
    }),
    db.package.count({
      where: {
        deletedAt: null,
        state: "QUARANTINED",
        location: { premisesId },
      },
    }),
    db.order.count({
      where: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: today, lt: tomorrow },
      },
    }),
    db.order.aggregate({
      where: {
        premisesId,
        status: "COMPLETED",
        completedAt: { gte: today, lt: tomorrow },
      },
      _sum: { totalAmount: true },
    }),
    db.vendor.count({
      where: { deletedAt: null, isApproved: true },
    }),
  ]);

  return {
    licenseCount,
    expiringLicenses,
    availablePackages,
    quarantinedPackages,
    todayOrders,
    todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
    activeVendors,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.premisesId) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.premisesId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your dispensary operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Licenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <ShieldCheck className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.licenseCount}</div>
            {data.expiringLicenses > 0 && (
              <div className="text-destructive mt-1 flex items-center gap-1 text-sm">
                <AlertTriangle className="size-3" />
                {data.expiringLicenses} expiring within 90 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Packages</CardTitle>
            <Package className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.availablePackages}</div>
            {data.quarantinedPackages > 0 && (
              <div className="mt-1 flex items-center gap-1 text-sm text-amber-600">
                <AlertTriangle className="size-3" />
                {data.quarantinedPackages} in quarantine
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <ShoppingCart className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayOrders} orders</div>
            <p className="text-muted-foreground mt-1 text-sm">
              ${data.todayRevenue.toFixed(2)} revenue
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <DollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.todayRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeVendors}</div>
          </CardContent>
        </Card>

        {/* Quick Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Compliance</span>
                <Badge variant={data.expiringLicenses > 0 ? "destructive" : "secondary"}>
                  {data.expiringLicenses > 0 ? "Attention" : "OK"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inventory</span>
                <Badge variant={data.quarantinedPackages > 0 ? "outline" : "secondary"}>
                  {data.quarantinedPackages > 0 ? "Review" : "OK"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks across your systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction href="/pos" label="Open POS" description="Start selling" />
            <QuickAction href="/inventory" label="View Inventory" description="Check stock" />
            <QuickAction href="/compliance" label="Check Licenses" description="Review status" />
            <QuickAction href="/finance" label="View Reports" description="Today's numbers" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a href={href} className="hover:bg-muted flex flex-col rounded-lg border p-3 transition-colors">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-muted-foreground text-xs">{description}</span>
    </a>
  );
}
