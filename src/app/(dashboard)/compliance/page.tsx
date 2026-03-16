import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { FilterSelect } from "@/components/search/filter-select";
import { Skeleton } from "@/components/ui/skeleton";
import { AddLicenseButton, EditLicenseButton } from "./_components/license-actions";

export const metadata = {
  title: "Compliance",
};

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusBadge(status: string) {
  const variant =
    {
      ACTIVE: "secondary" as const,
      PENDING: "outline" as const,
      SUSPENDED: "destructive" as const,
      REVOKED: "destructive" as const,
      EXPIRED: "destructive" as const,
    }[status] ?? ("outline" as const);

  return <Badge variant={variant}>{status}</Badge>;
}

const LICENSE_TYPE_OPTIONS = [
  { value: "ADULT_USE_RETAIL", label: "Adult Use Retail" },
  { value: "MEDICINAL_RETAIL", label: "Medicinal Retail" },
  { value: "ADULT_USE_DELIVERY", label: "Adult Use Delivery" },
  { value: "MEDICINAL_DELIVERY", label: "Medicinal Delivery" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "CULTIVATOR", label: "Cultivator" },
  { value: "TESTING_LAB", label: "Testing Lab" },
  { value: "MICROBUSINESS", label: "Microbusiness" },
];

const LICENSE_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REVOKED", label: "Revoked" },
  { value: "EXPIRED", label: "Expired" },
];

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session?.user?.premisesId) {
    redirect("/login");
  }

  const premisesId = session.user.premisesId;
  const params = await searchParams;
  const typeFilter = params.type ?? "";
  const statusFilter = params.status ?? "";

  const [licenses, localAuths, localRules] = await Promise.all([
    db.license.findMany({
      where: {
        premisesId,
        deletedAt: null,
        ...(typeFilter ? { licenseType: typeFilter as never } : {}),
        ...(statusFilter ? { status: statusFilter as never } : {}),
      },
      orderBy: { expiresAt: "asc" },
    }),
    db.localAuthorization.findMany({
      where: { premisesId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    db.localRule.findMany({
      where: { premisesId },
      orderBy: { ruleKey: "asc" },
    }),
  ]);

  const expiringLicenses = licenses.filter((l) => {
    const days = daysUntil(l.expiresAt);
    return days <= l.warningDays && days > 0;
  });

  const expiredLicenses = licenses.filter(
    (l) => l.status === "EXPIRED" || daysUntil(l.expiresAt) <= 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-muted-foreground">
          License management, local authorizations, and compliance rules
        </p>
      </div>

      {/* Alerts */}
      {(expiringLicenses.length > 0 || expiredLicenses.length > 0) && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {expiredLicenses.map((l) => (
                <li key={l.id} className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="size-3" />
                  <span className="font-medium">{l.licenseNumber}</span> has expired
                </li>
              ))}
              {expiringLicenses.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-amber-600">
                  <Clock className="size-3" />
                  <span className="font-medium">{l.licenseNumber}</span> expires in{" "}
                  {daysUntil(l.expiresAt)} days
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect paramKey="type" label="License Type" options={LICENSE_TYPE_OPTIONS} />
          <FilterSelect paramKey="status" label="Status" options={LICENSE_STATUS_OPTIONS} />
        </div>
      </Suspense>

      {/* DCC Licenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              DCC Licenses
            </CardTitle>
            <AddLicenseButton premisesId={premisesId} />
          </div>
          <CardDescription>
            State cannabis licenses issued by the Department of Cannabis Control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Days Left</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No licenses found
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => {
                  const days = daysUntil(license.expiresAt);
                  return (
                    <TableRow key={license.id}>
                      <TableCell className="font-mono text-sm">{license.licenseNumber}</TableCell>
                      <TableCell>{license.licenseType.replace(/_/g, " ")}</TableCell>
                      <TableCell>{statusBadge(license.status)}</TableCell>
                      <TableCell>{license.issuedBy}</TableCell>
                      <TableCell>{license.expiresAt.toLocaleDateString("en-US")}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            days <= 0
                              ? "text-destructive font-bold"
                              : days <= 90
                                ? "text-amber-600"
                                : ""
                          }
                        >
                          {days <= 0 ? "EXPIRED" : days}
                        </span>
                      </TableCell>
                      <TableCell>
                        <EditLicenseButton premisesId={premisesId} license={license} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Local Authorizations */}
      <Card>
        <CardHeader>
          <CardTitle>Local Authorizations</CardTitle>
          <CardDescription>
            City and county permits required on top of state DCC licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Authority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Permit #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localAuths.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No local authorizations found
                  </TableCell>
                </TableRow>
              ) : (
                localAuths.map((la) => (
                  <TableRow key={la.id}>
                    <TableCell>{la.authority}</TableCell>
                    <TableCell>{la.type}</TableCell>
                    <TableCell className="font-mono text-sm">{la.permitNumber ?? "—"}</TableCell>
                    <TableCell>{statusBadge(la.status)}</TableCell>
                    <TableCell>
                      {la.expiresAt ? la.expiresAt.toLocaleDateString("en-US") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Local Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Local Compliance Rules</CardTitle>
          <CardDescription>
            Jurisdiction-specific rules that override state defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Rule Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No local rules configured
                  </TableCell>
                </TableRow>
              ) : (
                localRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.jurisdiction}</TableCell>
                    <TableCell className="font-mono text-sm">{rule.ruleKey}</TableCell>
                    <TableCell className="font-mono text-sm">{rule.ruleValue}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {rule.description ?? "—"}
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
