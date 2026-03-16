import type { Metadata } from "next";
import { StorefrontNav } from "@/components/layouts/storefront-nav";
import { StorefrontFooter } from "@/components/layouts/storefront-footer";

export const metadata: Metadata = {
  title: {
    default: "Shop | Dispensory",
    template: "%s | Dispensory Shop",
  },
  description:
    "Browse premium, lab-tested cannabis products from a DCC-licensed California dispensary.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-900 focus:shadow-lg focus:outline focus:outline-2 focus:outline-[var(--sf-green)]"
      >
        Skip to main content
      </a>

      <StorefrontNav />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100vh-4rem)] outline-none"
      >
        {children}
      </main>

      <StorefrontFooter />
    </>
  );
}
