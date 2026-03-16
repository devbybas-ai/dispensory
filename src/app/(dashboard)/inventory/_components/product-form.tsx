"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { wrapAction } from "@/lib/action-response";
import { createProduct, updateProduct } from "@/domains/inventory/catalog/actions";

// ─────────────────────────────────────────────────────────────
// Product Category enum (matches Prisma ProductCategory)
// ─────────────────────────────────────────────────────────────

const ProductCategoryEnum = z.enum([
  "FLOWER",
  "PRE_ROLL",
  "VAPE",
  "CONCENTRATE",
  "EDIBLE",
  "TOPICAL",
  "TINCTURE",
  "CAPSULE",
  "ACCESSORY",
]);

const ProductFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  brand: z.string().trim().max(200).optional(),
  category: ProductCategoryEnum,
  description: z.string().trim().max(2000).optional(),
  sku: z.string().trim().max(50).optional(),
  unitPrice: z.string().optional(),
  costPrice: z.string().optional(),
  unitWeight: z.string().optional(),
  unitOfMeasure: z.string().trim().max(20).optional(),
  requiresLabTest: z.boolean(),
  isForAdultUse: z.boolean(),
  isForMedicinal: z.boolean(),
  vendorId: z.string().optional(),
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

// ─────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = ProductCategoryEnum.options.map((value) => ({
  value,
  label: value.replace(/_/g, " "),
}));

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface VendorOption {
  id: string;
  name: string;
}

interface ProductData {
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
}

interface ProductFormProps {
  product?: ProductData;
  vendors: VendorOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductForm({ product, vendors, open, onOpenChange }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!product;

  const vendorOptions = [
    { value: "", label: "No vendor" },
    ...vendors.map((v) => ({ value: v.id, label: v.name })),
  ];

  const { control, handleSubmit, reset } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: product?.name ?? "",
      brand: product?.brand ?? "",
      category: (product?.category as ProductFormValues["category"]) ?? "FLOWER",
      description: product?.description ?? "",
      sku: product?.sku ?? "",
      unitPrice: product?.unitPrice ? String(product.unitPrice) : "",
      costPrice: product?.costPrice ? String(product.costPrice) : "",
      unitWeight: product?.unitWeight ? String(product.unitWeight) : "",
      unitOfMeasure: product?.unitOfMeasure ?? "each",
      requiresLabTest: product?.requiresLabTest ?? true,
      isForAdultUse: product?.isForAdultUse ?? true,
      isForMedicinal: product?.isForMedicinal ?? false,
      vendorId: product?.vendorId ?? "",
    },
  });

  async function onSubmit(values: ProductFormValues) {
    setIsSubmitting(true);

    const unitPrice = values.unitPrice ? parseFloat(values.unitPrice) : undefined;
    const costPrice = values.costPrice ? parseFloat(values.costPrice) : undefined;
    const unitWeight = values.unitWeight ? parseFloat(values.unitWeight) : undefined;

    const result = isEditing
      ? await wrapAction(() =>
          updateProduct({
            id: product.id,
            name: values.name,
            brand: values.brand || undefined,
            category: values.category,
            description: values.description || undefined,
            sku: values.sku || undefined,
            unitPrice,
            costPrice,
            unitWeight,
            unitOfMeasure: values.unitOfMeasure || undefined,
            isForAdultUse: values.isForAdultUse,
            isForMedicinal: values.isForMedicinal,
          })
        )
      : await wrapAction(() =>
          createProduct({
            name: values.name,
            brand: values.brand || undefined,
            category: values.category,
            description: values.description || undefined,
            sku: values.sku || undefined,
            unitPrice,
            costPrice,
            unitWeight,
            unitOfMeasure: values.unitOfMeasure || undefined,
            requiresLabTest: values.requiresLabTest,
            isForAdultUse: values.isForAdultUse,
            isForMedicinal: values.isForMedicinal,
            vendorId: values.vendorId || undefined,
          })
        );

    setIsSubmitting(false);

    if (result.success) {
      toast.success(isEditing ? "Product updated" : "Product created");
      reset();
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product details below."
              : "Enter the product details below. Compliance review will be required before the product can be sold."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="name"
              label="Product Name"
              placeholder="Product name"
            />

            <FormField control={control} name="brand" label="Brand" placeholder="Brand name" />

            <FormField
              control={control}
              name="category"
              label="Category"
              type="select"
              options={CATEGORY_OPTIONS}
              placeholder="Select category"
            />

            <FormField
              control={control}
              name="vendorId"
              label="Vendor"
              type="select"
              options={vendorOptions}
              placeholder="Select vendor"
            />

            <FormField control={control} name="sku" label="SKU" placeholder="SKU-001" />

            <FormField
              control={control}
              name="unitOfMeasure"
              label="Unit of Measure"
              placeholder="each"
            />

            <FormField
              control={control}
              name="unitPrice"
              label="Unit Price ($)"
              type="number"
              placeholder="0.00"
            />

            <FormField
              control={control}
              name="costPrice"
              label="Cost Price ($)"
              type="number"
              placeholder="0.00"
            />

            <FormField
              control={control}
              name="unitWeight"
              label="Unit Weight (g)"
              type="number"
              placeholder="0.0000"
            />

            <FormField
              control={control}
              name="description"
              label="Description"
              type="textarea"
              placeholder="Product description"
              className="sm:col-span-2"
            />
          </div>

          {/* Boolean checkboxes */}
          <div className="flex flex-wrap gap-6">
            <Controller
              control={control}
              name="requiresLabTest"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="size-4 rounded border"
                  />
                  Requires Lab Test
                </label>
              )}
            />

            <Controller
              control={control}
              name="isForAdultUse"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="size-4 rounded border"
                  />
                  Adult Use (21+)
                </label>
              )}
            />

            <Controller
              control={control}
              name="isForMedicinal"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="size-4 rounded border"
                  />
                  Medicinal (18+)
                </label>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
