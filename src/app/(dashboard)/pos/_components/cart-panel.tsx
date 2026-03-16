"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, User } from "lucide-react";
import {
  calculateTaxLines,
  sumTaxLines,
  type TaxConfig,
} from "@/domains/finance/tax/tax-engine";
import type { CartState, CartAction } from "@/domains/commerce/pos/cart-reducer";
import { CustomerSearch } from "./customer-search";
import { CheckoutDialog } from "./checkout-dialog";

interface CartPanelProps {
  cart: CartState;
  dispatch: React.Dispatch<CartAction>;
  premisesId: string;
  taxConfig: Partial<TaxConfig>;
  hasActiveShift: boolean;
}

export function CartPanel({
  cart,
  dispatch,
  premisesId,
  taxConfig,
  hasActiveShift,
}: CartPanelProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const taxLines = useMemo(
    () => calculateTaxLines(cart.subtotal, taxConfig),
    [cart.subtotal, taxConfig]
  );
  const totalTax = useMemo(() => sumTaxLines(taxLines), [taxLines]);
  const total = useMemo(
    () => Math.round((cart.subtotal + totalTax) * 100) / 100,
    [cart.subtotal, totalTax]
  );

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              Cart
            </CardTitle>
            {itemCount > 0 && <Badge variant="secondary">{itemCount}</Badge>}
          </div>
          {cart.items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "CLEAR_CART" })}
              aria-label="Clear cart"
            >
              Clear
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Cart Items */}
          {cart.items.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-muted-foreground text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.packageId} className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.productName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        ${item.unitPrice.toFixed(2)} each
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        dispatch({
                          type: "REMOVE_ITEM",
                          payload: { packageId: item.packageId },
                        })
                      }
                      aria-label={`Remove ${item.productName} from cart`}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_QUANTITY",
                            payload: {
                              packageId: item.packageId,
                              quantity: item.quantity - 1,
                            },
                          })
                        }
                        aria-label={`Decrease quantity of ${item.productName}`}
                      >
                        <Minus />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={item.quantity >= item.maxQuantity}
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_QUANTITY",
                            payload: {
                              packageId: item.packageId,
                              quantity: item.quantity + 1,
                            },
                          })
                        }
                        aria-label={`Increase quantity of ${item.productName}`}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <span className="text-sm font-medium">
                      ${item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          {cart.items.length > 0 && (
            <>
              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Tax</span>
                  <span>${totalTax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {/* Customer Section */}
          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground size-4" />
              <span className="text-sm font-medium">Customer</span>
            </div>

            <CustomerSearch
              onSelect={(customer) =>
                dispatch({ type: "SET_CUSTOMER", payload: customer })
              }
              selectedCustomer={
                cart.customerName
                  ? {
                      name: cart.customerName,
                      type: cart.customerType,
                    }
                  : undefined
              }
              onClear={() => dispatch({ type: "CLEAR_CUSTOMER" })}
            />

            {!cart.customerName && (
              <p className="text-muted-foreground text-xs">
                Walk-in customer (Adult Use)
              </p>
            )}
          </div>

          {/* Checkout Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={cart.items.length === 0 || !hasActiveShift}
            onClick={() => setCheckoutOpen(true)}
          >
            {!hasActiveShift
              ? "Open Shift to Checkout"
              : cart.items.length === 0
                ? "Add Items to Cart"
                : `Checkout - $${total.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>

      <CheckoutDialog
        cart={cart}
        dispatch={dispatch}
        premisesId={premisesId}
        taxConfig={taxConfig}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
    </>
  );
}
