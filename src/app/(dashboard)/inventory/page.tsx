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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle } from "lucide-react";
import { SearchInput } from "@/components/search/search-input";
import { FilterSelect } from "@/components/search/filter-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AddProductButton,
  EditProductButton,
  AddVendorButton,
} from "./_components/inventory-actions";

export const metadata = {
  title: "Inventory",
};

const STATE_LABELS: Record<string, string> = {
  INBOUND: "Inbound",
  QUARANTINED: "Quarantined",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for Delivery",
  RETURNED: "Returned",
  DESTROYED: "Destroyed",
  RECALLED: "Recalled",
  EXPIRED: "Expired",
};

function stateBadge(state: string) {
  const variant =
    {
      AVAILABLE: "secondary" as const,
      RESERVED: "outline" as const,
      QUARANTINED: "destructive" as const,
      RECALLED: "destructive" as const,
      DESTROYED: "destructive" as const,
      EXPIRED: "destructive" as const,
    }[state] ?? ("outline" as const);

  return <Badge variant={variant}>{STATE_LABELS[state] ?? state}</Badge>;
}

const STATE_OPTIONS = Object.entries(STATE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const CATEGORY_OPTIONS = [
  { value: "FLOWER", label: "Flower" },
  { value: "PRE_ROLL", label: "Pre Roll" },
  { value: "VAPE", label: "Vape" },
  { value: "CONCENTRATE", label: "Concentrate" },
  { value: "EDIBLE", label: "Edible" },
  { value: "TOPICAL", label: "Topical" },
  { value: "TINCTURE", label: "Tincture" },
  { value: "CAPSULE", label: "Capsule" },
  { value: "ACCESSORY", label: "Accessory" },
];

export default async function InventoryPage({
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
  const search = params.search ?? "";
  const stateFilter = params.state ?? "";
  const categoryFilter = params.category ?? "";

  const [packages, products, stateCounts, vendors] = await Promise.all([
    db.package.findMany({
      where: {
        deletedAt: null,
        location: { premisesId },
        ...(stateFilter ? { state: stateFilter as never } : {}),
        ...(search
          ? {
              OR: [
                { metrcUid: { contains: search, mode: "insensitive" as const } },
                {
                  batch: {
                    productMaster: {
                      name: { contains: search, mode: "insensitive" as const },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        batch: { include: { productMaster: true } },
        location: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.productMaster.findMany({
      where: {
        deletedAt: null,
        ...(categoryFilter ? { category: categoryFilter as never } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { brand: { contains: search, mode: "insensitive" as const } },
                { sku: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: {
        vendor: { select: { name: true } },
        _count: { select: { batches: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.package.groupBy({
      by: ["state"],
      where: { deletedAt: null, location: { premisesId } },
      _count: true,
      _sum: { quantity: true },
    }),
    db.vendor.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Product catalog, packages, and inventory tracking</p>
      </div>

      {/* State Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stateCounts.map((sc) => (
          <Card key={sc.state}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {STATE_LABELS[sc.state] ?? sc.state}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sc._count}</div>
              <p className="text-muted-foreground text-sm">
                {Number(sc._sum.quantity ?? 0)} units total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <SearchInput placeholder="Search products, UIDs, SKUs..." />
          </div>
          <FilterSelect paramKey="state" label="State" options={STATE_OPTIONS} />
          <FilterSelect paramKey="category" label="Category" options={CATEGORY_OPTIONS} />
        </div>
      </Suspense>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages ({packages.length})</TabsTrigger>
          <TabsTrigger value="catalog">Product Catalog ({products.length})</TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Inventory Packages
              </CardTitle>
              <CardDescription>All tracked packages with Metrc UIDs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metrc UID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Hold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground text-center">
                        No packages found
                      </TableCell>
                    </TableRow>
                  ) : (
                    packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono text-xs">{pkg.metrcUid}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{pkg.batch.productMaster.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {pkg.batch.batchNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{stateBadge(pkg.state)}</TableCell>
                        <TableCell>
                          {Number(pkg.quantity)} {pkg.unitOfMeasure}
                        </TableCell>
                        <TableCell>{pkg.location?.name ?? "Unassigned"}</TableCell>
                        <TableCell>
                          {pkg.expiresAt ? pkg.expiresAt.toLocaleDateString("en-US") : "—"}
                        </TableCell>
                        <TableCell>
                          {pkg.isOnHold && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="size-3" />
                              <span className="text-xs">{pkg.holdReason}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Catalog Tab */}
        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Catalog</CardTitle>
                <div className="flex items-center gap-2">
                  <AddVendorButton />
                  <AddProductButton vendors={vendors} />
                </div>
              </div>
              <CardDescription>All registered products with compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Batches</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground text-center">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.brand && (
                              <div className="text-muted-foreground text-xs">{product.brand}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.category.replace(/_/g, " ")}</TableCell>
                        <TableCell className="font-mono text-xs">{product.sku ?? "—"}</TableCell>
                        <TableCell>{product.vendor?.name ?? "—"}</TableCell>
                        <TableCell>${Number(product.unitPrice ?? 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.complianceStatus === "APPROVED"
                                ? "secondary"
                                : product.complianceStatus === "BLOCKED"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {product.complianceStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{product._count.batches}</TableCell>
                        <TableCell>
                          <EditProductButton
                            product={{
                              id: product.id,
                              name: product.name,
                              brand: product.brand,
                              category: product.category,
                              description: product.description,
                              sku: product.sku,
                              unitPrice: product.unitPrice ? Number(product.unitPrice) : null,
                              costPrice: product.costPrice ? Number(product.costPrice) : null,
                              unitWeight: product.unitWeight ? Number(product.unitWeight) : null,
                              unitOfMeasure: product.unitOfMeasure,
                              requiresLabTest: product.requiresLabTest,
                              isForAdultUse: product.isForAdultUse,
                              isForMedicinal: product.isForMedicinal,
                              vendorId: product.vendorId,
                            }}
                            vendors={vendors}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
