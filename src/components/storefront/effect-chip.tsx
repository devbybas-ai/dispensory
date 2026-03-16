import Link from "next/link";
import { EFFECT_COLORS, EFFECT_LABELS, type EffectKey } from "./effect-colors";

interface EffectChipProps {
  effect: EffectKey;
  size?: "sm" | "md";
}

export function EffectChip({ effect, size = "md" }: EffectChipProps) {
  const colors = EFFECT_COLORS[effect];
  const label = EFFECT_LABELS[effect];
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <Link
      href={`/shop/menu?effect=${effect}`}
      className={`inline-flex items-center rounded-full border font-medium transition-all duration-[var(--sf-duration-base)] hover:shadow-md ${sizeClasses} ${colors.bg} ${colors.border} ${colors.text} ${colors.hover}`}
    >
      {label}
    </Link>
  );
}
