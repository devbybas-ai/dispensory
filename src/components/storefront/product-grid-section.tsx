import { ProductCard } from "./product-card";
import type { StorefrontProduct } from "@/types/storefront";
import Link from "next/link";

interface ProductGridSectionProps {
  title: string;
  viewAllHref?: string;
  products: StorefrontProduct[];
}

export function ProductGridSection({ title, viewAllHref, products }: ProductGridSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12" aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`} className="text-2xl font-bold text-neutral-900">{title}</h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700">View All →</Link>
          )}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
