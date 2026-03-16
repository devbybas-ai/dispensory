import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { EffectChip } from "@/components/storefront/effect-chip";
import { CATEGORY_LABELS } from "@/types/storefront";
import type { StorefrontProduct } from "@/types/storefront";
import type { ProductCategory } from "@/generated/prisma/client";
import type { EffectKey } from "@/components/storefront/effect-colors";

export const metadata: Metadata = {
  title: "Menu",
};

const allMockProducts: StorefrontProduct[] = [
  {
    id: "1",
    name: "Pacific Haze",
    slug: "pacific-haze",
    brand: null,
    category: "FLOWER",
    description: null,
    unitPrice: 45,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "SATIVA",
    thcPercent: 28.5,
    cbdPercent: null,
    terpenes: [],
    effects: [
      { effect: "ENERGY", intensity: 3 },
      { effect: "CREATIVITY", intensity: 3 },
      { effect: "FOCUS", intensity: 2 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 20,
    isStaffPick: true,
    isNew: false,
    salePercent: null,
  },
  {
    id: "2",
    name: "Midnight Indica",
    slug: "midnight-indica",
    brand: null,
    category: "FLOWER",
    description: null,
    unitPrice: 38,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "INDICA",
    thcPercent: 24.2,
    cbdPercent: 0.8,
    terpenes: [],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "SLEEP", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 15,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
  {
    id: "3",
    name: "Sunset Vape Cartridge",
    slug: "sunset-vape-cartridge",
    brand: null,
    category: "VAPE",
    description: null,
    unitPrice: 55,
    unitWeight: 1,
    unitOfMeasure: "gram",
    strainType: "HYBRID",
    thcPercent: 89.3,
    cbdPercent: null,
    terpenes: [],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "EUPHORIA", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 30,
    isStaffPick: true,
    isNew: false,
    salePercent: 15,
  },
  {
    id: "4",
    name: "Bliss Gummies",
    slug: "bliss-gummies",
    brand: null,
    category: "EDIBLE",
    description: null,
    unitPrice: 25,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: null,
    thcPercent: null,
    cbdPercent: null,
    terpenes: [],
    effects: [
      { effect: "RELAXATION", intensity: 2 },
      { effect: "EUPHORIA", intensity: 2 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 50,
    isStaffPick: false,
    isNew: false,
    salePercent: 20,
  },
  {
    id: "5",
    name: "Relief Topical Balm",
    slug: "relief-topical-balm",
    brand: null,
    category: "TOPICAL",
    description: null,
    unitPrice: 32,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: null,
    thcPercent: null,
    cbdPercent: 15,
    terpenes: [],
    effects: [{ effect: "PAIN_RELIEF", intensity: 3 }],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 25,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
  {
    id: "6",
    name: "Focus Pre-Roll Pack",
    slug: "focus-pre-roll-pack",
    brand: "SoCal Farms",
    category: "PRE_ROLL",
    description: null,
    unitPrice: 28,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "SATIVA",
    thcPercent: 26.1,
    cbdPercent: null,
    terpenes: ["Terpinolene", "Pinene"],
    effects: [
      { effect: "FOCUS", intensity: 4 },
      { effect: "ENERGY", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 18,
    isStaffPick: false,
    isNew: false,
    salePercent: null,
  },
  {
    id: "7",
    name: "Dreamscape Tincture",
    slug: "dreamscape-tincture",
    brand: "Valley Greens",
    category: "TINCTURE",
    description: null,
    unitPrice: 42,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: "INDICA",
    thcPercent: 18.5,
    cbdPercent: 5.0,
    terpenes: ["Linalool", "Myrcene"],
    effects: [
      { effect: "SLEEP", intensity: 5 },
      { effect: "RELAXATION", intensity: 4 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 8,
    isStaffPick: false,
    isNew: false,
    salePercent: null,
  },
  {
    id: "8",
    name: "Golden State Shatter",
    slug: "golden-state-shatter",
    brand: "Pacific Extracts",
    category: "CONCENTRATE",
    description: null,
    unitPrice: 65,
    unitWeight: 1,
    unitOfMeasure: "gram",
    strainType: "HYBRID",
    thcPercent: 92.1,
    cbdPercent: null,
    terpenes: ["Caryophyllene", "Limonene"],
    effects: [
      { effect: "EUPHORIA", intensity: 5 },
      { effect: "CREATIVITY", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 10,
    isStaffPick: false,
    isNew: false,
    salePercent: 10,
  },
  {
    id: "9",
    name: "Cali Kush OG",
    slug: "cali-kush-og",
    brand: "Valley Greens",
    category: "FLOWER",
    description: null,
    unitPrice: 50,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "INDICA",
    thcPercent: 30.1,
    cbdPercent: null,
    terpenes: ["Myrcene", "Caryophyllene", "Limonene"],
    effects: [
      { effect: "RELAXATION", intensity: 5 },
      { effect: "PAIN_RELIEF", intensity: 3 },
      { effect: "SLEEP", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 14,
    isStaffPick: true,
    isNew: false,
    salePercent: null,
  },
  {
    id: "10",
    name: "Citrus Burst Vape",
    slug: "citrus-burst-vape",
    brand: "Pacific Extracts",
    category: "VAPE",
    description: null,
    unitPrice: 48,
    unitWeight: 0.5,
    unitOfMeasure: "gram",
    strainType: "SATIVA",
    thcPercent: 85.7,
    cbdPercent: null,
    terpenes: ["Limonene", "Terpinolene"],
    effects: [
      { effect: "ENERGY", intensity: 4 },
      { effect: "FOCUS", intensity: 3 },
      { effect: "CREATIVITY", intensity: 2 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 22,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
  {
    id: "11",
    name: "Chill Chocolate Bar",
    slug: "chill-chocolate-bar",
    brand: "Cali Confections",
    category: "EDIBLE",
    description: null,
    unitPrice: 30,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: null,
    thcPercent: null,
    cbdPercent: null,
    terpenes: [],
    effects: [
      { effect: "RELAXATION", intensity: 4 },
      { effect: "SLEEP", intensity: 2 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 35,
    isStaffPick: false,
    isNew: false,
    salePercent: 15,
  },
  {
    id: "12",
    name: "Hybrid Haze Pre-Roll",
    slug: "hybrid-haze-pre-roll",
    brand: "SoCal Farms",
    category: "PRE_ROLL",
    description: null,
    unitPrice: 12,
    unitWeight: 1,
    unitOfMeasure: "gram",
    strainType: "HYBRID",
    thcPercent: 22.8,
    cbdPercent: 0.3,
    terpenes: ["Myrcene", "Pinene"],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "CREATIVITY", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 40,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
];

const CATEGORIES: ProductCategory[] = [
  "FLOWER",
  "PRE_ROLL",
  "VAPE",
  "CONCENTRATE",
  "EDIBLE",
  "TOPICAL",
  "TINCTURE",
  "CAPSULE",
];

const STRAIN_TYPES = ["SATIVA", "INDICA", "HYBRID"] as const;
type StrainType = (typeof STRAIN_TYPES)[number];

const EFFECT_KEYS: EffectKey[] = [
  "RELAXATION",
  "FOCUS",
  "PAIN_RELIEF",
  "ENERGY",
  "SLEEP",
  "CREATIVITY",
  "EUPHORIA",
];

interface MenuPageProps {
  searchParams: Promise<{
    category?: string;
    strain?: string;
    effect?: string;
  }>;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  const activeCategory = params.category as ProductCategory | undefined;
  const activeStrain = params.strain as StrainType | undefined;
  const activeEffect = params.effect as EffectKey | undefined;

  const filtered = allMockProducts.filter((product) => {
    if (activeCategory && product.category !== activeCategory) return false;
    if (activeStrain && product.strainType !== activeStrain) return false;
    if (activeEffect && !product.effects.some((e) => e.effect === activeEffect)) return false;
    return true;
  });

  function buildFilterUrl(updates: Record<string, string | undefined>) {
    const current: Record<string, string> = {};
    if (activeCategory) current.category = activeCategory;
    if (activeStrain) current.strain = activeStrain;
    if (activeEffect) current.effect = activeEffect;
    const merged = { ...current, ...updates };
    // Remove undefined entries
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined) clean[k] = v;
    }
    const qs = new URLSearchParams(clean).toString();
    return `/shop/menu${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">Menu</h1>
          <p className="text-sm text-neutral-500">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 space-y-5">
          {/* Category pills */}
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">Category</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/shop/menu"
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  !activeCategory
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                All
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={buildFilterUrl({ category: activeCategory === cat ? undefined : cat })}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </div>
          </div>

          {/* Strain type pills */}
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">Strain Type</p>
            <div className="flex flex-wrap gap-2">
              {STRAIN_TYPES.map((strain) => (
                <Link
                  key={strain}
                  href={buildFilterUrl({ strain: activeStrain === strain ? undefined : strain })}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeStrain === strain
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {strain.charAt(0) + strain.slice(1).toLowerCase()}
                </Link>
              ))}
            </div>
          </div>

          {/* Effect chips */}
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">Effects</p>
            <div className="flex flex-wrap gap-2">
              {EFFECT_KEYS.map((effect) => (
                <EffectChip key={effect} effect={effect} size="md" />
              ))}
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="mt-10">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-24 text-center">
              <p className="text-lg font-medium text-neutral-900">No products match your filters.</p>
              <p className="mt-1 text-sm text-neutral-500">Try removing a filter to see more results.</p>
              <Link
                href="/shop/menu"
                className="mt-6 rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
