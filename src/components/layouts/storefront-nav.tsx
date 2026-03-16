"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Menu", href: "/shop/menu" },
  { label: "Deals", href: "/shop/menu?collection=deals" },
  { label: "Brands", href: "/shop/menu?sort=brand" },
] as const;

export function StorefrontNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-[var(--sf-nav-blur)]"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/shop"
          className="text-xl font-bold tracking-tight text-neutral-900 transition-opacity duration-[var(--sf-duration-base)] hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
          aria-label="Dispensory — go to shop home"
        >
          Dispensory
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Storefront navigation" className="hidden md:block">
          <ul role="list" className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-neutral-600 transition-colors duration-[var(--sf-duration-base)] ease-[var(--sf-ease-base)] hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open search"
            className="rounded-full p-2 text-neutral-600 transition-colors duration-[var(--sf-duration-base)] hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>

          <Link
            href="/shop/cart"
            aria-label="Shopping cart"
            className="rounded-full p-2 text-neutral-600 transition-colors duration-[var(--sf-duration-base)] hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-full p-2 text-neutral-600 transition-colors duration-[var(--sf-duration-base)] hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)] md:hidden"
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          role="navigation"
          aria-label="Mobile storefront navigation"
          className="border-t border-neutral-200/60 bg-white/95 backdrop-blur-[var(--sf-nav-blur)] md:hidden"
        >
          <ul role="list" className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-700 transition-colors duration-[var(--sf-duration-base)] hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
