import Link from "next/link";
import Image from "next/image";
import { EffectChip } from "./effect-chip";
import { STRAIN_COLORS, type StorefrontProduct } from "@/types/storefront";
import type { EffectKey } from "./effect-colors";

interface ProductCardProps {
  product: StorefrontProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const strainColors = product.strainType ? STRAIN_COLORS[product.strainType] : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-[var(--sf-duration-base)] hover:border-neutral-300 hover:shadow-lg">
      {/* Image */}
      <Link
        href={`/shop/menu/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-neutral-100"
        aria-label={`View ${product.name}`}
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.imageAlt || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-[var(--sf-duration-spring)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-neutral-300">🌿</div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isStaffPick && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">Staff Pick</span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">New</span>
          )}
          {product.salePercent && (
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">{product.salePercent}% Off</span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          {strainColors && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${strainColors.bg} ${strainColors.text}`}>
              {product.strainType}
            </span>
          )}
          {product.brand && <span className="truncate text-xs text-neutral-500">{product.brand}</span>}
        </div>

        <Link href={`/shop/menu/${product.slug}`}>
          <h3 className="mt-1.5 font-semibold leading-tight text-neutral-900 transition-colors group-hover:text-emerald-700">
            {product.name}
          </h3>
        </Link>

        {(product.thcPercent || product.cbdPercent) && (
          <div className="mt-2 flex gap-1.5">
            {product.thcPercent && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">THC {product.thcPercent}%</span>
            )}
            {product.cbdPercent && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">CBD {product.cbdPercent}%</span>
            )}
          </div>
        )}

        {product.effects.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.effects.slice(0, 3).map((e) => (
              <EffectChip key={e.effect} effect={e.effect as EffectKey} size="sm" />
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="text-lg font-bold text-neutral-900">${product.unitPrice.toFixed(2)}</span>
            {product.unitWeight && (
              <span className="ml-1 text-sm text-neutral-500">/ {product.unitWeight}{product.unitOfMeasure === "gram" ? "g" : ""}</span>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-[var(--sf-duration-base)] hover:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            aria-label={`Add ${product.name} to cart`}
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
