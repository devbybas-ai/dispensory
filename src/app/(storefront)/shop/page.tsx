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
];

const staffPicks = mockProducts.filter((p) => p.isStaffPick);

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
        products={mockProducts}
      />
      <CategoryGrid />
      <InfoSection />
    </main>
  );
}
