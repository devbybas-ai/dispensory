import Link from "next/link";

const shopLinks = [
  { label: "Menu", href: "/shop/menu" },
  { label: "Flower", href: "/shop/menu?category=flower" },
  { label: "Vapes", href: "/shop/menu?category=vapes" },
  { label: "Edibles", href: "/shop/menu?category=edibles" },
  { label: "Concentrates", href: "/shop/menu?category=concentrates" },
] as const;

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
] as const;

const supportLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "Delivery", href: "/delivery-info" },
  { label: "Return Policy", href: "/returns" },
] as const;

const complianceBadges = [
  { label: "DCC Licensed" },
  { label: "Lab Tested" },
  { label: "Track & Trace" },
  { label: "21+ Only" },
] as const;

export function StorefrontFooter() {
  return (
    <footer
      role="contentinfo"
      className="bg-neutral-950 text-neutral-400"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand blurb */}
          <div>
            <p className="text-xl font-bold tracking-tight text-white">Dispensory</p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              California&apos;s compliance-first dispensary. Premium cannabis products sourced from
              licensed cultivators, tested in accredited labs, and delivered to your door.
            </p>
          </div>

          {/* Shop links */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Shop
            </h2>
            <ul role="list" className="mt-4 space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Company
            </h2>
            <ul role="list" className="mt-4 space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Support
            </h2>
            <ul role="list" className="mt-4 space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-green)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance badges */}
        <div className="mt-12 border-t border-neutral-800 pt-8">
          <div
            role="list"
            aria-label="Compliance certifications"
            className="flex flex-wrap gap-3"
          >
            {complianceBadges.map((badge) => (
              <div
                key={badge.label}
                role="listitem"
                className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-xs font-medium text-neutral-300"
              >
                {badge.label}
              </div>
            ))}
          </div>

          {/* Copyright */}
          <p className="mt-6 text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} Dispensory. All rights reserved. DCC Licensed
            Retailer. For use by adults 21 years of age or older. Keep out of reach of children.
            Cannabis products have intoxicating effects and may be habit forming. Smoking is
            hazardous to your health.
          </p>
        </div>
      </div>
    </footer>
  );
}
