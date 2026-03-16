"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, User } from "lucide-react";
import { searchCustomers } from "@/domains/commerce/customer/actions";
import { wrapAction } from "@/lib/action-response";
import { toast } from "sonner";

interface CustomerResult {
  id: string;
  firstName: string;
  lastName: string;
  type: "ADULT_USE" | "MEDICINAL";
  phone: string | null;
}

interface CustomerSearchProps {
  onSelect: (customer: {
    id: string;
    name: string;
    type: "ADULT_USE" | "MEDICINAL";
  }) => void;
  selectedCustomer?: { name: string; type: string };
  onClear: () => void;
}

export function CustomerSearch({
  onSelect,
  selectedCustomer,
  onClear,
}: CustomerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const response = await wrapAction(() => searchCustomers(searchQuery.trim()));

    if (response.success) {
      const mapped: CustomerResult[] = response.data.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        type: c.type as "ADULT_USE" | "MEDICINAL",
        phone: c.phone,
      }));
      setResults(mapped);
      setShowResults(mapped.length > 0);
    } else {
      toast.error("Customer search failed", {
        description: response.error,
      });
      setResults([]);
      setShowResults(false);
    }

    setIsSearching(false);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleSelect(customer: CustomerResult) {
    onSelect({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      type: customer.type,
    });
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  // If a customer is already selected, show their info
  if (selectedCustomer) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
        <div className="flex items-center gap-2">
          <User className="text-muted-foreground size-4" />
          <div>
            <p className="text-sm font-medium">{selectedCustomer.name}</p>
            <Badge variant="outline" className="mt-0.5">
              {selectedCustomer.type.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          aria-label="Remove selected customer"
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search customers..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          className="pl-8"
          aria-label="Search customers by name or email"
        />
      </div>

      {isSearching && (
        <p className="text-muted-foreground mt-1 text-xs">Searching...</p>
      )}

      {showResults && results.length > 0 && (
        <div className="bg-popover ring-foreground/10 absolute z-50 mt-1 w-full rounded-lg shadow-md ring-1">
          <ul role="listbox" aria-label="Customer search results">
            {results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => handleSelect(customer)}
                >
                  <div>
                    <p className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </p>
                    {customer.phone && (
                      <p className="text-muted-foreground text-xs">
                        {customer.phone}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {customer.type.replace("_", " ")}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
