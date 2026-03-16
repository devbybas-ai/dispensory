"use client";

// NOTE: This component reads useSearchParams, which requires a <Suspense>
// boundary in the parent tree. Wrap the page or layout section that renders
// this component in <Suspense fallback={...}> to avoid a client-side bailout.

import { useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  paramKey: string;
  label: string;
  options: FilterOption[];
}

const selectClasses =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 dark:bg-input/30 dark:disabled:bg-input/80 h-8 w-full min-w-0 appearance-none rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export function FilterSelect({ paramKey, label, options }: FilterSelectProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const currentValue = searchParams.get(paramKey) ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (newValue) {
      params.set(paramKey, newValue);
    } else {
      params.delete(paramKey);
    }

    // Reset pagination when filter changes
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`filter-${paramKey}`}
        className="flex items-center gap-2 text-sm leading-none font-medium select-none"
      >
        {label}
      </label>
      <select
        id={`filter-${paramKey}`}
        value={currentValue}
        onChange={handleChange}
        className={cn(selectClasses)}
        aria-label={label}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
