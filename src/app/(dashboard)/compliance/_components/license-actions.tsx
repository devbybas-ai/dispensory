"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LicenseForm } from "./license-form";

// ─────────────────────────────────────────────────────────────
// "Add License" button -- used in the CardHeader
// ─────────────────────────────────────────────────────────────

interface AddLicenseButtonProps {
  premisesId: string;
}

export function AddLicenseButton({ premisesId }: AddLicenseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" data-icon="inline-start" />
        Add License
      </Button>
      <LicenseForm premisesId={premisesId} open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// "Edit" button -- used per table row
// ─────────────────────────────────────────────────────────────

interface EditLicenseButtonProps {
  premisesId: string;
  license: {
    id: string;
    licenseType: string;
    licenseNumber: string;
    status: string;
    issuedBy: string;
    issuedAt: Date | null;
    expiresAt: Date;
    warningDays: number;
  };
}

export function EditLicenseButton({ premisesId, license }: EditLicenseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen(true)}
        aria-label="Edit license"
      >
        <Pencil className="size-3" />
      </Button>
      <LicenseForm premisesId={premisesId} license={license} open={open} onOpenChange={setOpen} />
    </>
  );
}
