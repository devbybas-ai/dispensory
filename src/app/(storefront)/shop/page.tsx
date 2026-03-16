import type { Metadata } from "next";
import type { StorefrontProduct } from "@/types/storefront";
import { HeroSection } from "@/components/storefront/hero-section";
import { ProductGridSection } from "@/components/storefront/product-grid-section";
import { CategoryGrid } from "@/components/storefront/category-grid";
import { InfoSection } from "@/components/storefront/info-section";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse our premium cannabis flower, vapes, edibles, and more. Carefully curated for quality and compliance.",
};

const mockProducts: StorefrontProduct[] = [
  {
    id: "1",
    name: "Pacific Haze",
    slug: "pacific-haze",
    brand: "SoCal Farms",
    category: "FLOWER",
    description: null,
    unitPrice: 45,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "SATIVA",
    thcPercent: 28.5,
    cbdPercent: null,
    terpenes: ["Myrcene", "Limonene"],
    effects: [
      { effect: "ENERGY", intensity: 4 },
      { effect: "CREATIVITY", intensity: 3 },
      { effect: "FOCUS", intensity: 3 },
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
    brand: "Valley Greens",
    category: "FLOWER",
    description: null,
    unitPrice: 38,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "INDICA",
    thcPercent: 24.2,
    cbdPercent: 0.8,
    terpenes: ["Myrcene", "Linalool"],
    effects: [
      { effect: "RELAXATION", intensity: 5 },
      { effect: "SLEEP", intensity: 4 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 15,
    isStaffPick: true,
    isNew: false,
    salePercent: null,
  },
  {
    id: "3",
    name: "Sunset Vape Cartridge",
    slug: "sunset-vape-cartridge",
    brand: "Pacific Extracts",
    category: "VAPE",
    description: null,
    unitPrice: 55,
    unitWeight: 1,
    unitOfMeasure: "gram",
    strainType: "HYBRID",
    thcPercent: 89.3,
    cbdPercent: null,
    terpenes: ["Limonene", "Terpinolene"],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "EUPHORIA", intensity: 4 },
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
    brand: "Cali Confections",
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
      { effect: "RELAXATION", intensity: 3 },
      { effect: "EUPHORIA", intensity: 2 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 50,
    isStaffPick: true,
    isNew: false,
    salePercent: 20,
  },
  {
    id: "5",
    name: "Focus Pre-Roll Pack",
    slug: "focus-pre-roll-5pk",
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
    availableQuantity: 20,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
  {
    id: "6",
    name: "Relief Topical Balm",
    slug: "relief-topical-balm",
    brand: "Heal Co",
    category: "TOPICAL",
    description: null,
    unitPrice: 32,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: null,
    thcPercent: null,
    cbdPercent: 15,
    terpenes: [],
    effects: [{ effect: "PAIN_RELIEF", intensity: 4 }],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 12,
    isStaffPick: false,
    isNew: true,
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
];

const staffPicks = mockProducts.filter((p) => p.isStaffPick);
const popular = mockProducts.slice(0, 8);

export default function ShopPage() {
  return (
    <main>
      <HeroSection />
      <ProductGridSection
        title="Staff Picks"
        viewAllHref="/shop/menu?collection=staff-picks"
        products={staffPicks}
      />
      <ProductGridSection
        title="Popular Right Now"
        viewAllHref="/shop/menu?sort=popular"
        products={popular}
      />
      <CategoryGrid />
      <InfoSection />
    </main>
  );
}
