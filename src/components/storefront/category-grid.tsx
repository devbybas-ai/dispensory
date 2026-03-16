import Link from "next/link";
import { ProductCategory } from "@/generated/prisma/client";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/types/storefront";

// The 8 categories surfaced on the storefront (CAPSULE is excluded — internal use)
const STOREFRONT_CATEGORIES: ProductCategory[] = [
  "FLOWER",
  "VAPE",
  "EDIBLE",
  "CONCENTRATE",
  "PRE_ROLL",
  "TOPICAL",
  "TINCTURE",
  "ACCESSORY",
];

export function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading" className="py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <h2
          id="categories-heading"
          className="mb-8 text-center text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
        >
          Shop by Category
        </h2>

        <ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
          role="list"
          aria-label="Product categories"
        >
          {STOREFRONT_CATEGORIES.map((category) => (
            <li key={category}>
              <Link
                href={`/shop/menu?category=${category}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden="true"
                  className="text-3xl transition-transform duration-200 group-hover:scale-110"
                >
                  {CATEGORY_ICONS[category]}
                </span>
                <span className="text-xs font-semibold tracking-wide text-neutral-700 group-hover:text-emerald-700">
                  {CATEGORY_LABELS[category]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
