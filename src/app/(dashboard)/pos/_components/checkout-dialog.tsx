"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { createOrder, processPayment } from "@/domains/commerce/pos/actions";
import { wrapAction } from "@/lib/action-response";
import {
  calculateTaxLines,
  sumTaxLines,
  type TaxConfig,
} from "@/domains/finance/tax/tax-engine";
import type { CartState, CartAction } from "@/domains/commerce/pos/cart-reducer";

type PaymentMethod = "CASH" | "DEBIT" | "ACH";

interface CheckoutDialogProps {
  cart: CartState;
  dispatch: React.Dispatch<CartAction>;
  premisesId: string;
  taxConfig: Partial<TaxConfig>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({
  cart,
  dispatch,
  premisesId,
  taxConfig,
  open,
  onOpenChange,
}: CheckoutDialogProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountTendered, setAmountTendered] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const taxLines = useMemo(
    () => calculateTaxLines(cart.subtotal, taxConfig),
    [cart.subtotal, taxConfig]
  );
  const totalTax = useMemo(() => sumTaxLines(taxLines), [taxLines]);
  const total = useMemo(
    () => Math.round((cart.subtotal + totalTax) * 100) / 100,
    [cart.subtotal, totalTax]
  );

  const tenderedAmount = parseFloat(amountTendered) || 0;
  const change =
    paymentMethod === "CASH" && tenderedAmount > total
      ? Math.round((tenderedAmount - total) * 100) / 100
      : 0;
  const isCashSufficient =
    paymentMethod !== "CASH" || tenderedAmount >= total;

  async function handleCompleteSale() {
    if (!isCashSufficient) {
      toast.error("Insufficient cash tendered");
      return;
    }

    setIsProcessing(true);

    // Step 1: Create the order
    const orderResult = await wrapAction(() =>
      createOrder({
        premisesId,
        customerId: cart.customerId,
        type: cart.customerType,
        lines: cart.items.map((item) => ({
          packageId: item.packageId,
          quantity: item.quantity,
        })),
      })
    );

    if (!orderResult.success) {
      toast.error("Failed to create order", {
        description: orderResult.error,
      });
      setIsProcessing(false);
      return;
    }

    // Step 2: Process payment
    const paymentResult = await wrapAction(() =>
      processPayment({
        orderId: orderResult.data.id,
        method: paymentMethod,
        amount: total,
        tendered: paymentMethod === "CASH" ? tenderedAmount : undefined,
        transactionRef:
          paymentMethod !== "CASH"
            ? `${paymentMethod}-${Date.now()}`
            : undefined,
      })
    );

    if (!paymentResult.success) {
      toast.error("Payment failed", {
        description: paymentResult.error,
      });
      setIsProcessing(false);
      return;
    }

    // Success
    toast.success("Sale completed", {
      description: `Order ${orderResult.data.orderNumber} - $${total.toFixed(2)}${
        paymentMethod === "CASH" && change > 0
          ? ` (Change: $${change.toFixed(2)})`
          : ""
      }`,
    });

    dispatch({ type: "CLEAR_CART" });
    setPaymentMethod("CASH");
    setAmountTendered("");
    setIsProcessing(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
          <DialogDescription>
            Review the order and select a payment method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Order Summary</p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {cart.items.map((item) => (
                <div
                  key={item.packageId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {item.productName}{" "}
                    <span className="text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </span>
                  <span className="ml-2 shrink-0">
                    ${item.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            {taxLines.map((line) => (
              <div key={line.taxType} className="flex justify-between">
                <span className="text-muted-foreground">
                  {line.description}
                </span>
                <span>${line.taxAmount.toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-2">
              {(
                [
                  { value: "CASH" as const, label: "Cash", icon: DollarSign },
                  { value: "DEBIT" as const, label: "Debit", icon: CreditCard },
                  { value: "ACH" as const, label: "ACH", icon: CreditCard },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={paymentMethod === value ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setPaymentMethod(value);
                    setAmountTendered("");
                  }}
                  aria-pressed={paymentMethod === value}
                >
                  <Icon data-icon="inline-start" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Cash Tendered */}
          {paymentMethod === "CASH" && (
            <div className="space-y-2">
              <Label htmlFor="amount-tendered">Amount Tendered</Label>
              <Input
                id="amount-tendered"
                type="number"
                min={0}
                step="0.01"
                placeholder={`Min $${total.toFixed(2)}`}
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                aria-describedby="change-display"
              />
              {tenderedAmount > 0 && (
                <div
                  id="change-display"
                  className={`text-sm font-medium ${
                    tenderedAmount >= total
                      ? "text-green-600 dark:text-green-400"
                      : "text-destructive"
                  }`}
                >
                  {tenderedAmount >= total
                    ? `Change: $${change.toFixed(2)}`
                    : `Short: $${(total - tenderedAmount).toFixed(2)}`}
                </div>
              )}
            </div>
          )}

          {/* Customer */}
          {cart.customerName && (
            <div className="text-muted-foreground text-sm">
              Customer: {cart.customerName} ({cart.customerType.replace("_", " ")})
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            disabled={
              isProcessing || cart.items.length === 0 || !isCashSufficient
            }
            onClick={handleCompleteSale}
          >
            {isProcessing ? "Processing..." : `Complete Sale - $${total.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
