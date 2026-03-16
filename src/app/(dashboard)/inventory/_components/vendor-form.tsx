"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
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
import { createVendor, updateVendor } from "@/domains/inventory/vendor/actions";

// ─────────────────────────────────────────────────────────────
// Vendor Type enum (matches Prisma VendorType)
// ─────────────────────────────────────────────────────────────

const VendorTypeEnum = z.enum(["DISTRIBUTOR", "MANUFACTURER", "CULTIVATOR", "BRAND", "SUPPLIER"]);

const VendorFormSchema = z.object({
  type: VendorTypeEnum,
  name: z.string().trim().min(1, "Vendor name is required").max(200),
  legalName: z.string().trim().max(200).optional(),
  licenseNumber: z.string().trim().max(50).optional(),
  contactName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().max(200).optional(),
  street: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(2).optional(),
  zip: z.string().trim().max(10).optional(),
});

type VendorFormValues = z.infer<typeof VendorFormSchema>;

// ─────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────

const VENDOR_TYPE_OPTIONS = VendorTypeEnum.options.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}));

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface VendorData {
  id: string;
  type: string;
  name: string;
  legalName: string | null;
  licenseNumber: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface VendorFormProps {
  vendor?: VendorData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorForm({ vendor, open, onOpenChange }: VendorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!vendor;

  const { control, handleSubmit, reset } = useForm<VendorFormValues>({
    resolver: zodResolver(VendorFormSchema) as Resolver<VendorFormValues>,
    defaultValues: {
      type: (vendor?.type as VendorFormValues["type"]) ?? "DISTRIBUTOR",
      name: vendor?.name ?? "",
      legalName: vendor?.legalName ?? "",
      licenseNumber: vendor?.licenseNumber ?? "",
      contactName: vendor?.contactName ?? "",
      phone: vendor?.phone ?? "",
      email: vendor?.email ?? "",
      street: vendor?.street ?? "",
      city: vendor?.city ?? "",
      state: vendor?.state ?? "CA",
      zip: vendor?.zip ?? "",
    },
  });

  async function onSubmit(values: VendorFormValues) {
    setIsSubmitting(true);

    // Clean up empty strings to undefined for optional fields
    const cleaned = {
      ...values,
      legalName: values.legalName || undefined,
      licenseNumber: values.licenseNumber || undefined,
      contactName: values.contactName || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      street: values.street || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      zip: values.zip || undefined,
    };

    const result = isEditing
      ? await wrapAction(() =>
          updateVendor({
            id: vendor.id,
            ...cleaned,
          })
        )
      : await wrapAction(() => createVendor(cleaned));

    setIsSubmitting(false);

    if (result.success) {
      toast.success(isEditing ? "Vendor updated" : "Vendor created");
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
          <DialogTitle>{isEditing ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the vendor details below."
              : "Enter the vendor details below. License verification is required for approval."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="type"
              label="Vendor Type"
              type="select"
              options={VENDOR_TYPE_OPTIONS}
              placeholder="Select type"
            />

            <FormField
              control={control}
              name="name"
              label="Name"
              placeholder="Vendor display name"
            />

            <FormField
              control={control}
              name="legalName"
              label="Legal Name"
              placeholder="Legal entity name"
            />

            <FormField
              control={control}
              name="licenseNumber"
              label="License Number"
              placeholder="C11-0000001-LIC"
            />

            <FormField
              control={control}
              name="contactName"
              label="Contact Name"
              placeholder="Primary contact"
            />

            <FormField control={control} name="phone" label="Phone" placeholder="(555) 555-5555" />

            <FormField
              control={control}
              name="email"
              label="Email"
              type="email"
              placeholder="vendor@example.com"
            />

            <FormField control={control} name="street" label="Street" placeholder="123 Main St" />

            <FormField control={control} name="city" label="City" placeholder="Los Angeles" />

            <FormField control={control} name="state" label="State" placeholder="CA" />

            <FormField control={control} name="zip" label="ZIP" placeholder="90001" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Vendor" : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
