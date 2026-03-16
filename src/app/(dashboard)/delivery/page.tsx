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
import { Truck, MapPin } from "lucide-react";

export const metadata = {
  title: "Delivery",
};

function tripStatusBadge(status: string) {
  const variant =
    {
      SCHEDULED: "outline" as const,
      DISPATCHED: "secondary" as const,
      EN_ROUTE: "secondary" as const,
      COMPLETED: "secondary" as const,
      CANCELLED: "destructive" as const,
    }[status] ?? ("outline" as const);

  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}

function stopStatusBadge(status: string) {
  const variant =
    {
      PENDING: "outline" as const,
      ARRIVED: "secondary" as const,
      DELIVERED: "secondary" as const,
      FAILED: "destructive" as const,
      REFUSED: "destructive" as const,
    }[status] ?? ("outline" as const);

  return <Badge variant={variant}>{status}</Badge>;
}

export default async function DeliveryPage() {
  const session = await auth();
  if (!session?.user?.premisesId) {
    redirect("/login");
  }

  const premisesId = session.user.premisesId;

  const [trips, activeTrips] = await Promise.all([
    db.deliveryTrip.findMany({
      where: { premisesId, deletedAt: null },
      include: {
        driver: { select: { name: true, employeeId: true } },
        stops: { orderBy: { stopNumber: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.deliveryTrip.count({
      where: {
        premisesId,
        deletedAt: null,
        status: { in: ["DISPATCHED", "EN_ROUTE"] },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Delivery</h1>
        <p className="text-muted-foreground">
          Manage delivery trips, dispatch drivers, and track proof of delivery
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <Truck className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrips}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trips.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stops</CardTitle>
            <MapPin className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trips.reduce((sum, t) => sum + t.stops.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="size-5" />
            Delivery Trips
          </CardTitle>
          <CardDescription>
            All delivery trips with driver assignments and stop details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip #</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Departed</TableHead>
                <TableHead>Returned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No delivery trips found
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => {
                  const completed = trip.stops.filter((s) => s.status === "DELIVERED").length;
                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="font-mono text-sm">{trip.tripNumber}</TableCell>
                      <TableCell>{trip.driver.name}</TableCell>
                      <TableCell>{tripStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        {completed}/{trip.stops.length} delivered
                      </TableCell>
                      <TableCell>{trip.vehiclePlate ?? "—"}</TableCell>
                      <TableCell>
                        {trip.departedAt
                          ? trip.departedAt.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {trip.returnedAt
                          ? trip.returnedAt.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Expanded Stop Details for Active Trips */}
          {trips
            .filter((t) => ["DISPATCHED", "EN_ROUTE"].includes(t.status))
            .map((trip) => (
              <div key={trip.id} className="mt-6">
                <h3 className="mb-2 text-sm font-semibold">{trip.tripNumber} — Stop Details</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ID Verified</TableHead>
                      <TableHead>Arrived</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trip.stops.map((stop) => (
                      <TableRow key={stop.id}>
                        <TableCell>{stop.stopNumber}</TableCell>
                        <TableCell>
                          {stop.street}, {stop.city} {stop.zip}
                        </TableCell>
                        <TableCell>{stopStatusBadge(stop.status)}</TableCell>
                        <TableCell>
                          {stop.idVerified ? <Badge variant="secondary">Verified</Badge> : "—"}
                        </TableCell>
                        <TableCell>
                          {stop.arrivedAt
                            ? stop.arrivedAt.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {stop.completedAt
                            ? stop.completedAt.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
