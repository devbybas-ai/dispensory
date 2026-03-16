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
import { createLicense, updateLicense } from "@/domains/compliance/licensing/actions";
import { LicenseTypeEnum, LicenseStatusEnum } from "@/domains/compliance/schemas";

// ─────────────────────────────────────────────────────────────
// Form schema -- plain z.object so the resolver types align.
// Date fields are strings in the form; coerced at submit time.
// ─────────────────────────────────────────────────────────────

const LicenseFormSchema = z.object({
  licenseType: LicenseTypeEnum,
  licenseNumber: z.string().trim().min(1, "License number is required").max(50),
  status: LicenseStatusEnum,
  issuedBy: z.string().trim().min(1, "Issuing authority is required").max(200),
  issuedAt: z.string().optional(),
  expiresAt: z.string().min(1, "Expiration date is required"),
  warningDays: z.string().default("90"),
});

type LicenseFormValues = z.infer<typeof LicenseFormSchema>;

// ─────────────────────────────────────────────────────────────
// Options for selects
// ─────────────────────────────────────────────────────────────

const LICENSE_TYPE_OPTIONS = LicenseTypeEnum.options.map((value) => ({
  value,
  label: value.replace(/_/g, " "),
}));

const LICENSE_STATUS_OPTIONS = LicenseStatusEnum.options.map((value) => ({
  value,
  label: value,
}));

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface LicenseData {
  id: string;
  licenseType: string;
  licenseNumber: string;
  status: string;
  issuedBy: string;
  issuedAt: Date | null;
  expiresAt: Date;
  warningDays: number;
}

interface LicenseFormProps {
  premisesId: string;
  license?: LicenseData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const iso = new Date(date).toISOString();
  return iso.slice(0, 10);
}

export function LicenseForm({ premisesId, license, open, onOpenChange }: LicenseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!license;

  const { control, handleSubmit, reset } = useForm<LicenseFormValues>({
    resolver: zodResolver(LicenseFormSchema) as Resolver<LicenseFormValues>,
    defaultValues: {
      licenseType: (license?.licenseType as LicenseFormValues["licenseType"]) ?? "ADULT_USE_RETAIL",
      licenseNumber: license?.licenseNumber ?? "",
      status: (license?.status as LicenseFormValues["status"]) ?? "PENDING",
      issuedBy: license?.issuedBy ?? "",
      issuedAt: toDateInputValue(license?.issuedAt),
      expiresAt: toDateInputValue(license?.expiresAt),
      warningDays: String(license?.warningDays ?? 90),
    },
  });

  async function onSubmit(values: LicenseFormValues) {
    setIsSubmitting(true);

    const warningDays = parseInt(values.warningDays, 10) || 90;

    const result = isEditing
      ? await wrapAction(() =>
          updateLicense({
            id: license.id,
            status: values.status,
            expiresAt: new Date(values.expiresAt),
            warningDays,
          })
        )
      : await wrapAction(() =>
          createLicense({
            premisesId,
            licenseType: values.licenseType,
            licenseNumber: values.licenseNumber,
            status: values.status,
            issuedBy: values.issuedBy,
            issuedAt: values.issuedAt ? new Date(values.issuedAt) : undefined,
            expiresAt: new Date(values.expiresAt),
            warningDays,
          })
        );

    setIsSubmitting(false);

    if (result.success) {
      toast.success(isEditing ? "License updated" : "License created");
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
          <DialogTitle>{isEditing ? "Edit License" : "Add License"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the DCC license details below."
              : "Enter the DCC license details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="licenseType"
              label="License Type"
              type="select"
              options={LICENSE_TYPE_OPTIONS}
              placeholder="Select type"
              disabled={isEditing}
            />

            <FormField
              control={control}
              name="licenseNumber"
              label="License Number"
              placeholder="C10-0000001-LIC"
              disabled={isEditing}
            />

            <FormField
              control={control}
              name="status"
              label="Status"
              type="select"
              options={LICENSE_STATUS_OPTIONS}
              placeholder="Select status"
            />

            <FormField
              control={control}
              name="issuedBy"
              label="Issued By"
              placeholder="DCC"
              disabled={isEditing}
            />

            <FormField control={control} name="issuedAt" label="Issued Date" type="date" />

            <FormField control={control} name="expiresAt" label="Expiration Date" type="date" />

            <FormField
              control={control}
              name="warningDays"
              label="Warning Days"
              type="number"
              placeholder="90"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update License" : "Create License"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
