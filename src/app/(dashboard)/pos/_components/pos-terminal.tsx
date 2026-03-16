"use client";

import { useReducer } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Clock, DollarSign } from "lucide-react";
import type { TaxConfig } from "@/domains/finance/tax/tax-engine";
import {
  cartReducer,
  initialCartState,
} from "@/domains/commerce/pos/cart-reducer";
import { ProductGrid } from "./product-grid";
import { CartPanel } from "./cart-panel";
import { ShiftControls } from "./shift-controls";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AvailableProduct {
  packageId: string;
  productName: string;
  brand: string;
  category: string;
  metrcUid: string;
  unitPrice: number;
  maxQuantity: number;
  thcPercent: number | null;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  type: string;
  lineCount: number;
  totalAmount: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
}

interface ActiveShift {
  id: string;
  startedAt: string;
  drawerCount: number;
}

interface POSTerminalProps {
  availableProducts: AvailableProduct[];
  recentOrders: RecentOrder[];
  activeShift: ActiveShift | null;
  todayStats: { orderCount: number; revenue: number };
  premisesId: string;
  taxConfig: Partial<TaxConfig>;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function orderStatusVariant(
  status: string
): "outline" | "secondary" | "destructive" {
  switch (status) {
    case "COMPLETED":
      return "secondary";
    case "VOIDED":
    case "RETURNED":
      return "destructive";
    default:
      return "outline";
  }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function POSTerminal({
  availableProducts,
  recentOrders,
  activeShift,
  todayStats,
  premisesId,
  taxConfig,
}: POSTerminalProps) {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">
            Process sales, manage shifts, and view orders
          </p>
        </div>
        <Badge variant={activeShift ? "secondary" : "destructive"}>
          {activeShift ? "Shift Open" : "No Active Shift"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shift Status</CardTitle>
            <Clock className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {activeShift ? (
              <div>
                <div className="text-lg font-bold">Active</div>
                <p className="text-muted-foreground text-sm">
                  Started{" "}
                  {new Date(activeShift.startedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-muted-foreground text-sm">
                  {activeShift.drawerCount} drawer(s) open
                </p>
              </div>
            ) : (
              <div>
                <div className="text-destructive text-lg font-bold">
                  No Shift
                </div>
                <p className="text-muted-foreground text-sm">
                  Open a shift to begin selling
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Orders
            </CardTitle>
            <ShoppingCart className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.orderCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Revenue
            </CardTitle>
            <DollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${todayStats.revenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Controls */}
      <ShiftControls activeShift={activeShift} premisesId={premisesId} />

      {/* Main POS Area: Product Grid + Cart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductGrid
            products={availableProducts}
            onAddToCart={(item) =>
              dispatch({ type: "ADD_ITEM", payload: item })
            }
          />
        </div>
        <div>
          <CartPanel
            cart={cart}
            dispatch={dispatch}
            premisesId={premisesId}
            taxConfig={taxConfig}
            hasActiveShift={activeShift !== null}
          />
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Last 20 orders processed at this location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground text-center"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.customerName ?? "Walk-in"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.type}</Badge>
                    </TableCell>
                    <TableCell>{order.lineCount}</TableCell>
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{order.paymentMethod ?? "\u2014"}</TableCell>
                    <TableCell>
                      <Badge variant={orderStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
