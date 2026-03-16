"use client";

// NOTE: This component reads useSearchParams, which requires a <Suspense>
// boundary in the parent tree. Wrap the page or layout section that renders
// this component in <Suspense fallback={...}> to avoid a client-side bailout.

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  paramKey?: string;
  placeholder?: string;
}

function SearchInputInner({
  paramKey,
  placeholder,
  urlValue,
}: {
  paramKey: string;
  placeholder: string;
  urlValue: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [value, setValue] = useState(urlValue);

  const pushSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (term.trim()) {
        params.set(paramKey, term.trim());
      } else {
        params.delete(paramKey);
      }

      // Reset pagination when search changes
      params.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, paramKey, pathname, router]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
  };

  // Debounce: push search to URL after 300ms of inactivity
  useEffect(() => {
    // Skip push if local value already matches URL
    if (value === urlValue) return;

    const timer = setTimeout(() => {
      pushSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, urlValue, pushSearch]);

  return (
    <Input
      type="search"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}

export function SearchInput({ paramKey = "search", placeholder = "Search..." }: SearchInputProps) {
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(paramKey) ?? "";

  // Using key to reset the inner component when the URL changes externally
  // (e.g., back/forward navigation, link clicks). This avoids needing to
  // sync state via useEffect or access refs during render.
  return (
    <SearchInputInner
      key={urlValue}
      paramKey={paramKey}
      placeholder={placeholder}
      urlValue={urlValue}
    />
  );
}
