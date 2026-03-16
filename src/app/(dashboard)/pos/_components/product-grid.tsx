"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { CartItem } from "@/domains/commerce/pos/cart-reducer";

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

interface ProductGridProps {
  products: AvailableProduct[];
  onAddToCart: (item: Omit<CartItem, "lineTotal">) => void;
}

function formatCategory(category: string): string {
  return category.replace(/_/g, " ");
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  function handleAdd(product: AvailableProduct) {
    onAddToCart({
      packageId: product.packageId,
      productName: product.productName,
      brand: product.brand,
      category: product.category,
      metrcUid: product.metrcUid,
      unitPrice: product.unitPrice,
      quantity: 1,
      maxQuantity: product.maxQuantity,
    });
  }

  if (products.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">
          No products available for sale
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const outOfStock = product.maxQuantity === 0;

        return (
          <Card key={product.packageId} size="sm">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">
                    {product.productName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {product.brand}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {formatCategory(product.category)}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {product.thcPercent !== null && (
                  <span className="text-muted-foreground">
                    THC {product.thcPercent}%
                  </span>
                )}
                <span className="text-muted-foreground">
                  Stock: {product.maxQuantity}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-semibold">
                  ${product.unitPrice.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  disabled={outOfStock}
                  onClick={() => handleAdd(product)}
                  aria-label={`Add ${product.productName} to cart`}
                >
                  <Plus data-icon="inline-start" />
                  {outOfStock ? "Out of Stock" : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
