"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./product-form";
import { VendorForm } from "./vendor-form";

// ─────────────────────────────────────────────────────────────
// Vendor option type (shared)
// ─────────────────────────────────────────────────────────────

interface VendorOption {
  id: string;
  name: string;
}

// ─────────────────────────────────────────────────────────────
// "Add Product" button
// ─────────────────────────────────────────────────────────────

interface AddProductButtonProps {
  vendors: VendorOption[];
}

export function AddProductButton({ vendors }: AddProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" data-icon="inline-start" />
        Add Product
      </Button>
      <ProductForm vendors={vendors} open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// "Edit Product" button
// ─────────────────────────────────────────────────────────────

interface EditProductButtonProps {
  product: {
    id: string;
    name: string;
    brand: string | null;
    category: string;
    description: string | null;
    sku: string | null;
    unitPrice: number | string | null;
    costPrice: number | string | null;
    unitWeight: number | string | null;
    unitOfMeasure: string;
    requiresLabTest: boolean;
    isForAdultUse: boolean;
    isForMedicinal: boolean;
    vendorId: string | null;
  };
  vendors: VendorOption[];
}

export function EditProductButton({ product, vendors }: EditProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen(true)}
        aria-label="Edit product"
      >
        <Pencil className="size-3" />
      </Button>
      <ProductForm product={product} vendors={vendors} open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// "Add Vendor" button
// ─────────────────────────────────────────────────────────────

export function AddVendorButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" data-icon="inline-start" />
        Add Vendor
      </Button>
      <VendorForm open={open} onOpenChange={setOpen} />
    </>
  );
}
