// Storefront types for the Dispensory customer-facing shop
import type { ProductCategory } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Product category display metadata
// ─────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  FLOWER: "Flower",
  PRE_ROLL: "Pre-Rolls",
  VAPE: "Vapes",
  CONCENTRATE: "Concentrates",
  EDIBLE: "Edibles",
  TOPICAL: "Topicals",
  TINCTURE: "Tinctures",
  CAPSULE: "Capsules",
  ACCESSORY: "Accessories",
};

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  FLOWER: "🌿",
  PRE_ROLL: "🚬",
  VAPE: "💨",
  CONCENTRATE: "💎",
  EDIBLE: "🍪",
  TOPICAL: "🧴",
  TINCTURE: "💧",
  CAPSULE: "💊",
  ACCESSORY: "🛒",
};

// ─────────────────────────────────────────────────────────────
// Strain type display metadata
// ─────────────────────────────────────────────────────────────

export const STRAIN_COLORS = {
  SATIVA: { bg: "bg-amber-100", text: "text-amber-800" },
  INDICA: { bg: "bg-purple-100", text: "text-purple-800" },
  HYBRID: { bg: "bg-emerald-100", text: "text-emerald-800" },
} as const;

// ─────────────────────────────────────────────────────────────
// Storefront product shape (public-facing, no sensitive data)
// ─────────────────────────────────────────────────────────────

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: ProductCategory;
  description: string | null;
  unitPrice: number;
  unitWeight: number | null;
  unitOfMeasure: string;
  strainType: "SATIVA" | "INDICA" | "HYBRID" | null;
  thcPercent: number | null;
  cbdPercent: number | null;
  terpenes: string[];
  effects: { effect: string; intensity: number }[];
  primaryImage: string | null;
  imageAlt: string | null;
  availableQuantity: number;
  isStaffPick: boolean;
  isNew: boolean;
  salePercent: number | null;
}
