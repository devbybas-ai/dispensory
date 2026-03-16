# Storefront Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the storefront foundation — age gate, layout, schema changes, homepage, and product catalog — so the client can see a premium, flowing browsing experience in the browser.

**Architecture:** New `(storefront)` route group with its own layout (nav, footer, cart provider). Extends existing Prisma schema with storefront fields (slug, strainType, isPublished, images, effects, collections). Middleware updated for age gate cookie check and public route registration. All components use shadcn/ui + Tailwind with smooth animations and reduced-motion respect.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS 4, shadcn/ui, Prisma 6, Zod v4, Vitest

**Spec:** `docs/superpowers/specs/2026-03-16-storefront-design.md`

**Scope:** Foundation only (Option B). Cart, checkout, customer auth, and order flow will be a separate plan.

---

## Chunk 1: Schema Changes + Age Gate

### Task 1: Extend Prisma Schema with Storefront Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new enums to schema**

Add after the last existing enum block (`DocumentType`, ends at line 197):

```prisma
enum StrainType {
  SATIVA
  INDICA
  HYBRID
}

enum EffectType {
  RELAXATION
  FOCUS
  PAIN_RELIEF
  ENERGY
  SLEEP
  CREATIVITY
  EUPHORIA
}

enum CollectionType {
  STAFF_PICKS
  POPULAR
  DEALS
  NEW_ARRIVALS
  CUSTOM
}

enum OrderChannel {
  POS
  ONLINE
}

enum FulfillmentType {
  PICKUP
  DELIVERY
}

enum OnlineOrderStatus {
  SUBMITTED
  CONFIRMED
  PREPARING
  READY
  OUT_FOR_DELIVERY
  COMPLETED
  CANCELLED
}
```

- [ ] **Step 2: Extend ProductMaster model**

Add these fields to the `ProductMaster` model (after `unitOfMeasure` field, before `batches`):

```prisma
  // Storefront
  slug            String?         @unique
  strainType      StrainType?
  isPublished     Boolean         @default(false)
  storefrontOrder Int?

  images  ProductImage[]
  effects ProductEffect[]
```

- [ ] **Step 3: Add ProductImage model**

Add after the `ProductMaster` model:

```prisma
model ProductImage {
  id              String        @id @default(cuid())
  productMasterId String
  productMaster   ProductMaster @relation(fields: [productMasterId], references: [id])

  url       String
  alt       String?
  sortOrder Int     @default(0)
  isPrimary Boolean @default(false)

  createdAt DateTime @default(now())

  @@index([productMasterId])
}
```

- [ ] **Step 4: Add ProductEffect model**

Add after `ProductImage`:

```prisma
model ProductEffect {
  id              String        @id @default(cuid())
  productMasterId String
  productMaster   ProductMaster @relation(fields: [productMasterId], references: [id])

  effect    EffectType
  intensity Int        @default(3)

  @@unique([productMasterId, effect])
  @@index([effect])
}
```

- [ ] **Step 5: Add Collection and CollectionProduct models**

Add after `ProductEffect`:

```prisma
model Collection {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  description String?
  type        CollectionType
  isActive    Boolean        @default(true)
  sortOrder   Int            @default(0)

  products CollectionProduct[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CollectionProduct {
  id              String        @id @default(cuid())
  collectionId    String
  collection      Collection    @relation(fields: [collectionId], references: [id])
  productMasterId String
  productMaster   ProductMaster @relation(fields: [productMasterId], references: [id])
  sortOrder       Int           @default(0)

  @@unique([collectionId, productMasterId])
  @@index([collectionId])
}
```

Also add reverse relation to `ProductMaster` model. In Step 2, after adding `effects ProductEffect[]`, also add:

```prisma
  collections CollectionProduct[]
```

- [ ] **Step 6: Extend Customer model for storefront**

Add these fields to the `Customer` model (after `email` field, before `idVerified`):

```prisma
  // Storefront extensions
  passwordHash  String?
  slug          String?   @unique
  preferences   Json?
  emailVerified Boolean   @default(false)

  addresses CustomerAddress[]
```

- [ ] **Step 7: Add CustomerAddress model**

Add after the `Customer` model:

```prisma
model CustomerAddress {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  label          String?
  street         String
  unit           String?
  city           String
  state          String  @default("CA")
  zip            String
  isDefault      Boolean @default(false)
  inDeliveryZone Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([customerId])
}
```

- [ ] **Step 8: Extend Order model for storefront**

Add these fields to the `Order` model (after `type` field, before `subtotal`):

```prisma
  // Storefront extensions
  channel         OrderChannel       @default(POS)
  fulfillmentType FulfillmentType?
  customerEmail   String?
  customerPhone   String?
  pickupTime      DateTime?
  onlineStatus    OnlineOrderStatus?
```

- [ ] **Step 9: Add PREMISES_ID to env validation**

In `src/lib/env.ts`, add to `serverEnvSchema` after `SOCKET_PORT`:

```typescript
  // Storefront
  PREMISES_ID: z.string().min(1).optional(),
```

- [ ] **Step 10: Run type-check to verify schema compiles**

Run: `pnpm type-check`
Expected: PASS (schema changes are Prisma-only, no TS errors)

- [ ] **Step 11: Commit schema changes**

```bash
git add prisma/schema.prisma src/lib/env.ts
git commit -m "feat: add storefront schema — ProductImage, ProductEffect, Collection, Customer/Order extensions"
```

---

### Task 2: Age Gate — Server Action + Cookie

**Files:**
- Create: `src/app/(storefront)/age-verify/actions.ts`
- Test: `src/test/age-gate.test.ts`

- [ ] **Step 1: Write failing test for age verification action**

Create `src/test/age-gate.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

// Mock next/headers since we're in a non-Next test environment
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
  })),
}));

describe("Age Gate", () => {
  it("should define AGE_COOKIE_NAME as age_verified", async () => {
    const { AGE_COOKIE_NAME } = await import(
      "@/app/(storefront)/age-verify/actions"
    );
    expect(AGE_COOKIE_NAME).toBe("age_verified");
  });

  it("should define AGE_COOKIE_MAX_AGE as 30 days in seconds", async () => {
    const { AGE_COOKIE_MAX_AGE } = await import(
      "@/app/(storefront)/age-verify/actions"
    );
    expect(AGE_COOKIE_MAX_AGE).toBe(30 * 24 * 60 * 60);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/test/age-gate.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create age-verify server action**

Create `src/app/(storefront)/age-verify/actions.ts`:

```typescript
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const AGE_COOKIE_NAME = "age_verified";
export const AGE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function verifyAge(returnTo?: string) {
  const cookieStore = await cookies();

  cookieStore.set(AGE_COOKIE_NAME, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AGE_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect(returnTo || "/shop");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/test/age-gate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(storefront)/age-verify/actions.ts src/test/age-gate.test.ts
git commit -m "feat: add age gate server action with 30-day HttpOnly cookie"
```

---

### Task 3: Age Gate — Page UI

**Files:**
- Create: `src/app/(storefront)/age-verify/page.tsx`

- [ ] **Step 1: Create the age gate page**

Create `src/app/(storefront)/age-verify/page.tsx`:

```tsx
import { verifyAge } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Age Verification",
  description: "You must be 21 or older to enter this website.",
};

export default function AgeVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return <AgeGateContent searchParams={searchParams} />;
}

async function AgeGateContent({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo || "/shop";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0a] px-4 text-white">
      {/* Skip link for a11y */}
      <a
        href="#age-question"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to age verification
      </a>

      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Dispensory
        </h1>
        <div className="mx-auto mt-3 h-0.5 w-16 bg-emerald-500" />
        <p className="mt-3 text-sm tracking-widest text-neutral-400 uppercase">
          Southern California
        </p>

        {/* Question */}
        <div id="age-question" className="mt-12" role="main" tabIndex={-1}>
          <p className="text-lg text-neutral-300">
            Are you 21 years of age or older?
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <form
              action={async () => {
                "use server";
                await verifyAge(returnTo);
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:w-auto"
              >
                Yes, Enter
              </button>
            </form>

            <button
              type="button"
              className="w-full rounded-lg border border-neutral-700 px-8 py-3 text-base font-semibold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 sm:w-auto"
              aria-expanded="false"
              data-age-deny
            >
              No
            </button>
          </div>

          {/* Denial message — shown via CSS :has() or JS, keeping it simple with a detail/summary */}
          <noscript>
            <p className="mt-6 text-sm text-neutral-500">
              JavaScript is required for age verification.
            </p>
          </noscript>
        </div>

        {/* Legal text */}
        <footer className="mt-16 space-y-2 text-xs text-neutral-600">
          <p>
            This website contains content related to cannabis products. You must
            be 21 years of age or older to enter, or 18+ with a valid
            physician&apos;s recommendation.
          </p>
          <p>California Department of Cannabis Control Licensed Retailer</p>
        </footer>
      </div>
    </div>
  );
}
```

Note: The "No" button denial UX will be handled with a small client component in a follow-up. For now, the button is present but non-functional (the page is server-rendered, and the "Yes" path is the critical flow).

- [ ] **Step 2: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/(storefront)/age-verify/page.tsx
git commit -m "feat: add age gate page — dark branded gate with DCC compliance text"
```

---

### Task 4: Age Gate — Middleware Integration

**Files:**
- Modify: `src/auth.config.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Update auth.config.ts with public storefront routes**

Replace the entire `src/auth.config.ts` file:

```typescript
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

// Edge-safe auth config (no Node.js-only dependencies)
// Used by middleware for JWT session verification + route protection

const publicRoutes = [
  "/login",
  "/api/auth",
  // Storefront (public, no auth required)
  "/age-verify",
  "/shop",
  "/api/shop",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

function isStorefrontRoute(pathname: string): boolean {
  return pathname.startsWith("/shop") || pathname.startsWith("/age-verify");
}

function isCustomerAccountRoute(pathname: string): boolean {
  return pathname.startsWith("/shop/account");
}

export { isStorefrontRoute, isCustomerAccountRoute };

export const authConfig = {
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8 hours (covers a shift)
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Credentials provider added in auth.ts (Node.js only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public storefront routes — no auth required
      if (isStorefrontRoute(pathname) && !isCustomerAccountRoute(pathname)) {
        return true;
      }

      // Other public routes — no auth required
      if (isPublicRoute(pathname) && !isLoggedIn) {
        return true;
      }

      // Staff routes — require auth
      if (!isPublicRoute(pathname) && !isLoggedIn) {
        return false; // Redirects to pages.signIn
      }

      // Redirect logged-in users away from login page
      if (pathname.startsWith("/login") && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.premisesId = user.premisesId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.premisesId = token.premisesId as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 2: Add age gate check to middleware**

Replace the entire `src/middleware.ts` file:

```typescript
import NextAuth from "next-auth";
import { authConfig, isStorefrontRoute } from "@/auth.config";
import { NextResponse } from "next/server";

const AGE_COOKIE_NAME = "age_verified";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // === Age gate check for storefront routes ===
  if (
    isStorefrontRoute(pathname) &&
    !pathname.startsWith("/age-verify")
  ) {
    const ageCookie = request.cookies.get(AGE_COOKIE_NAME);
    if (!ageCookie?.value) {
      const ageUrl = new URL("/age-verify", request.nextUrl.origin);
      ageUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(ageUrl);
    }
  }

  // === Security headers ===
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // CSP -- Tier A (Strict) baseline
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${process.env.S3_ENDPOINT || ""} ${process.env.S3_BUCKET ? `https://${process.env.S3_BUCKET}.s3.amazonaws.com` : ""}`.trim(),
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // HSTS -- production only
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // === CSRF -- Origin validation on state-changing requests ===
  const method = request.method;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new NextResponse("Forbidden: Origin mismatch", {
            status: 403,
          });
        }
      } catch {
        return new NextResponse("Forbidden: Invalid origin", { status: 403 });
      }
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
```

- [ ] **Step 3: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: Run existing tests to confirm no regressions**

Run: `pnpm test`
Expected: All existing tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/auth.config.ts src/middleware.ts
git commit -m "feat: integrate age gate into middleware — redirect /shop to /age-verify without cookie"
```

---

## Chunk 2: Storefront Layout + Design Tokens

### Task 5: Storefront CSS Design Tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add storefront-specific CSS custom properties**

Add after the `.dark { ... }` block (after line 117) and before the `@layer base` block:

```css
/* Storefront design tokens */
:root {
  --sf-green: #059669;
  --sf-green-light: #d1fae5;
  --sf-green-dark: #064e3b;
  --sf-indigo: #4f46e5;
  --sf-pink: #db2777;
  --sf-amber: #d97706;
  --sf-purple: #7c3aed;
  --sf-orange: #ea580c;
  --sf-nav-blur: 12px;
  --sf-hero-gradient-1: #059669;
  --sf-hero-gradient-2: #4f46e5;
  --sf-hero-gradient-3: #d97706;
  --sf-duration-base: 200ms;
  --sf-duration-spring: 500ms;
  --sf-ease-base: cubic-bezier(0.4, 0, 0.2, 1);
  --sf-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

- [ ] **Step 2: Run build to verify CSS compiles**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add storefront design tokens — effect colors, transitions, hero gradients"
```

---

### Task 6: Storefront Layout Shell

**Files:**
- Create: `src/app/(storefront)/layout.tsx`
- Create: `src/components/layouts/storefront-nav.tsx`
- Create: `src/components/layouts/storefront-footer.tsx`

- [ ] **Step 1: Create storefront nav component**

Create `src/components/layouts/storefront-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/shop/menu", label: "Menu" },
  { href: "/shop/menu?collection=deals", label: "Deals" },
  { href: "/shop/menu?sort=brand", label: "Brands" },
] as const;

export function StorefrontNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-[var(--sf-nav-blur)]"
      role="banner"
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/shop"
          className="text-xl font-bold tracking-tight text-neutral-900"
          aria-label="Dispensory home"
        >
          Dispensory
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-neutral-600 transition-colors duration-[var(--sf-duration-base)] hover:text-neutral-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link
            href="/shop/cart"
            className="relative rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            aria-label="Shopping cart, 0 items"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-neutral-200 bg-white px-4 py-4 md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <ul className="space-y-3" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50"
                  onClick={() => setMobileOpen(false)}
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
```

- [ ] **Step 2: Create storefront footer component**

Create `src/components/layouts/storefront-footer.tsx`:

```tsx
import Link from "next/link";

const footerLinks = {
  shop: [
    { href: "/shop/menu", label: "Full Menu" },
    { href: "/shop/menu?category=FLOWER", label: "Flower" },
    { href: "/shop/menu?category=VAPE", label: "Vapes" },
    { href: "/shop/menu?category=EDIBLE", label: "Edibles" },
    { href: "/shop/menu?category=CONCENTRATE", label: "Concentrates" },
  ],
  company: [
    { href: "#", label: "About Us" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Contact" },
  ],
  support: [
    { href: "#", label: "FAQ" },
    { href: "#", label: "Delivery Info" },
    { href: "#", label: "Return Policy" },
  ],
} as const;

const complianceBadges = [
  "DCC Licensed",
  "Lab Tested",
  "Track & Trace",
  "21+ Only",
] as const;

export function StorefrontFooter() {
  return (
    <footer className="bg-neutral-950 text-neutral-400" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold text-white">Dispensory</p>
            <p className="mt-2 text-sm">
              Premium cannabis retail for Southern California. Compliance-first,
              always.
            </p>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Shop
            </h3>
            <ul className="mt-4 space-y-2" role="list">
              {footerLinks.shop.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Company
            </h3>
            <ul className="mt-4 space-y-2" role="list">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Support
            </h3>
            <ul className="mt-4 space-y-2" role="list">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance badges */}
        <div className="mt-12 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {complianceBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-500"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Copyright & license */}
        <div className="mt-6 text-xs text-neutral-600">
          <p>
            &copy; {new Date().getFullYear()} Dispensory. All rights reserved.
          </p>
          <p className="mt-1">
            California Department of Cannabis Control Licensed Retailer
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create storefront layout**

Create `src/app/(storefront)/layout.tsx`:

```tsx
import { StorefrontNav } from "@/components/layouts/storefront-nav";
import { StorefrontFooter } from "@/components/layouts/storefront-footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Shop | Dispensory",
    template: "%s | Dispensory",
  },
  description:
    "Premium cannabis retail for Southern California. Browse flower, vapes, edibles, and more.",
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4 focus:text-neutral-900"
      >
        Skip to main content
      </a>
      <StorefrontNav />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
}
```

- [ ] **Step 4: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(storefront)/layout.tsx src/components/layouts/storefront-nav.tsx src/components/layouts/storefront-footer.tsx
git commit -m "feat: add storefront layout — frosted glass nav, dark footer with compliance badges"
```

---

## Chunk 3: Shop Homepage

### Task 7: Effect Chip Component

**Files:**
- Create: `src/components/storefront/effect-chip.tsx`
- Create: `src/components/storefront/effect-colors.ts`

- [ ] **Step 1: Create effect color map**

Create `src/components/storefront/effect-colors.ts`:

```typescript
export const EFFECT_COLORS = {
  RELAXATION: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", hover: "hover:bg-emerald-100 hover:shadow-emerald-200/50", hex: "#059669" },
  FOCUS: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", hover: "hover:bg-indigo-100 hover:shadow-indigo-200/50", hex: "#4f46e5" },
  PAIN_RELIEF: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700", hover: "hover:bg-pink-100 hover:shadow-pink-200/50", hex: "#db2777" },
  ENERGY: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", hover: "hover:bg-amber-100 hover:shadow-amber-200/50", hex: "#d97706" },
  SLEEP: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", hover: "hover:bg-purple-100 hover:shadow-purple-200/50", hex: "#7c3aed" },
  CREATIVITY: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", hover: "hover:bg-orange-100 hover:shadow-orange-200/50", hex: "#ea580c" },
  EUPHORIA: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", hover: "hover:bg-amber-100 hover:shadow-amber-200/50", hex: "#d97706" },
} as const;

export const EFFECT_LABELS: Record<string, string> = {
  RELAXATION: "Relaxation",
  FOCUS: "Focus",
  PAIN_RELIEF: "Pain Relief",
  ENERGY: "Energy",
  SLEEP: "Sleep",
  CREATIVITY: "Creativity",
  EUPHORIA: "Euphoria",
};

export type EffectKey = keyof typeof EFFECT_COLORS;
```

- [ ] **Step 2: Create effect chip component**

Create `src/components/storefront/effect-chip.tsx`:

```tsx
import Link from "next/link";
import { EFFECT_COLORS, EFFECT_LABELS, type EffectKey } from "./effect-colors";

interface EffectChipProps {
  effect: EffectKey;
  size?: "sm" | "md";
}

export function EffectChip({ effect, size = "md" }: EffectChipProps) {
  const colors = EFFECT_COLORS[effect];
  const label = EFFECT_LABELS[effect];

  const sizeClasses =
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <Link
      href={`/shop/menu?effect=${effect}`}
      className={`inline-flex items-center rounded-full border font-medium transition-all duration-[var(--sf-duration-base)] hover:shadow-md ${sizeClasses} ${colors.bg} ${colors.border} ${colors.text} ${colors.hover}`}
    >
      {label}
    </Link>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/storefront/effect-chip.tsx src/components/storefront/effect-colors.ts
git commit -m "feat: add effect chip component — color-coded links for guided discovery"
```

---

### Task 8: Product Card Component

**Files:**
- Create: `src/components/storefront/product-card.tsx`
- Create: `src/types/storefront.ts`

- [ ] **Step 1: Create storefront types**

Create `src/types/storefront.ts`:

```typescript
import type { ProductCategory } from "@/generated/prisma/client";

/** Product data assembled for storefront display */
export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: ProductCategory;
  description: string | null;
  unitPrice: number;
  unitWeight: number | null;
  unitOfMeasure: string;
  strainType: "SATIVA" | "INDICA" | "HYBRID" | null;

  // From latest passing Batch
  thcPercent: number | null;
  cbdPercent: number | null;
  terpenes: string[];

  // From ProductEffect
  effects: { effect: string; intensity: number }[];

  // From ProductImage
  primaryImage: string | null;
  imageAlt: string | null;

  // Stock
  availableQuantity: number;

  // Badges
  isStaffPick: boolean;
  isNew: boolean;
  salePercent: number | null;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  FLOWER: "Flower",
  PRE_ROLL: "Pre-Rolls",
  VAPE: "Vapes",
  CONCENTRATE: "Concentrates",
  EDIBLE: "Edibles",
  TOPICAL: "Topicals",
  TINCTURE: "Tinctures",
  CAPSULE: "Capsules",
  ACCESSORY: "Accessories",
};

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  FLOWER: "🌿",
  PRE_ROLL: "🚬",
  VAPE: "💨",
  CONCENTRATE: "💎",
  EDIBLE: "🍪",
  TOPICAL: "🧴",
  TINCTURE: "💧",
  CAPSULE: "💊",
  ACCESSORY: "🛒",
};

export const STRAIN_COLORS = {
  SATIVA: { bg: "bg-amber-100", text: "text-amber-800" },
  INDICA: { bg: "bg-purple-100", text: "text-purple-800" },
  HYBRID: { bg: "bg-emerald-100", text: "text-emerald-800" },
} as const;
```

- [ ] **Step 2: Create product card component**

Create `src/components/storefront/product-card.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { EffectChip } from "./effect-chip";
import { STRAIN_COLORS, type StorefrontProduct } from "@/types/storefront";
import type { EffectKey } from "./effect-colors";

interface ProductCardProps {
  product: StorefrontProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const strainColors = product.strainType
    ? STRAIN_COLORS[product.strainType]
    : null;

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
          <div className="flex h-full w-full items-center justify-center text-4xl text-neutral-300">
            🌿
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isStaffPick && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              Staff Pick
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              New
            </span>
          )}
          {product.salePercent && (
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              {product.salePercent}% Off
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Strain type + Brand */}
        <div className="flex items-center gap-2">
          {strainColors && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${strainColors.bg} ${strainColors.text}`}
            >
              {product.strainType}
            </span>
          )}
          {product.brand && (
            <span className="truncate text-xs text-neutral-500">
              {product.brand}
            </span>
          )}
        </div>

        {/* Name */}
        <Link href={`/shop/menu/${product.slug}`}>
          <h3 className="mt-1.5 font-semibold leading-tight text-neutral-900 transition-colors group-hover:text-emerald-700">
            {product.name}
          </h3>
        </Link>

        {/* THC/CBD pills */}
        {(product.thcPercent || product.cbdPercent) && (
          <div className="mt-2 flex gap-1.5">
            {product.thcPercent && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                THC {product.thcPercent}%
              </span>
            )}
            {product.cbdPercent && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                CBD {product.cbdPercent}%
              </span>
            )}
          </div>
        )}

        {/* Effects */}
        {product.effects.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.effects.slice(0, 3).map((e) => (
              <EffectChip
                key={e.effect}
                effect={e.effect as EffectKey}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="text-lg font-bold text-neutral-900">
              ${product.unitPrice.toFixed(2)}
            </span>
            {product.unitWeight && (
              <span className="ml-1 text-sm text-neutral-500">
                / {product.unitWeight}
                {product.unitOfMeasure === "gram" ? "g" : ""}
              </span>
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
```

- [ ] **Step 3: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/storefront/product-card.tsx src/types/storefront.ts
git commit -m "feat: add product card — data-rich with strain badges, THC/CBD pills, effect chips, hover animations"
```

---

### Task 9: Hero Section Component

**Files:**
- Create: `src/components/storefront/hero-section.tsx`

- [ ] **Step 1: Create hero section with animated text rotation**

Create `src/components/storefront/hero-section.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { EffectChip } from "./effect-chip";
import type { EffectKey } from "./effect-colors";

const rotatingWords = [
  "relaxation?",
  "better sleep?",
  "pain relief?",
  "creative energy?",
  "sharp focus?",
  "a good time?",
];

const heroEffects: EffectKey[] = [
  "RELAXATION",
  "FOCUS",
  "PAIN_RELIEF",
  "ENERGY",
  "SLEEP",
  "CREATIVITY",
];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative flex min-h-[90svh] flex-col items-center justify-center overflow-hidden px-4"
      aria-label="Welcome hero"
    >
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-indigo-50" />

      {/* Floating gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl motion-safe:animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl motion-safe:animate-pulse [animation-delay:2s]" />
      </div>

      {/* Dot grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Status badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-neutral-600">
            Open Now · Pickup & Delivery Available
          </span>
        </div>

        {/* Heading with rotating text */}
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
          Looking for{" "}
          <span
            className={`inline-block bg-gradient-to-r from-emerald-600 via-indigo-600 to-amber-600 bg-clip-text text-transparent transition-all duration-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            }`}
            aria-live="polite"
          >
            {rotatingWords[wordIndex]}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-600">
          Tell us how you want to feel. We&apos;ll match you with the perfect
          product from over 200 items in stock.
        </p>

        {/* Effect chips */}
        <div
          className="mt-8 flex flex-wrap justify-center gap-2"
          role="list"
          aria-label="Browse by effect"
        >
          {heroEffects.map((effect) => (
            <div key={effect} role="listitem">
              <EffectChip effect={effect} />
            </div>
          ))}
        </div>

        {/* Search hint */}
        <div className="mt-8">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <svg
              className="h-5 w-5 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-sm text-neutral-400">
              Search strains, brands, or effects...
            </span>
            <kbd className="ml-auto hidden rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 sm:inline-block">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce">
        <svg
          className="h-6 w-6 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l-7 7m0 0l-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/storefront/hero-section.tsx
git commit -m "feat: add hero section — gradient blobs, rotating text, effect chips, reduced motion support"
```

---

### Task 10: Category Grid Component

**Files:**
- Create: `src/components/storefront/category-grid.tsx`

- [ ] **Step 1: Create category grid**

Create `src/components/storefront/category-grid.tsx`:

```tsx
import Link from "next/link";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/types/storefront";
import type { ProductCategory } from "@/generated/prisma/client";

const displayCategories: ProductCategory[] = [
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
    <section className="py-16" aria-labelledby="categories-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="categories-heading"
          className="text-2xl font-bold text-neutral-900"
        >
          Shop by Category
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {displayCategories.map((cat) => (
            <Link
              key={cat}
              href={`/shop/menu?category=${cat}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-center transition-all duration-[var(--sf-duration-base)] hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm"
            >
              <span
                className="text-2xl transition-transform duration-[var(--sf-duration-spring)] group-hover:scale-110"
                aria-hidden="true"
              >
                {CATEGORY_ICONS[cat]}
              </span>
              <span className="text-xs font-medium text-neutral-700 group-hover:text-emerald-700">
                {CATEGORY_LABELS[cat]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/storefront/category-grid.tsx
git commit -m "feat: add category grid — 8 categories with emoji icons and hover animations"
```

---

### Task 11: Info Section Component

**Files:**
- Create: `src/components/storefront/info-section.tsx`

- [ ] **Step 1: Create info section**

Create `src/components/storefront/info-section.tsx`:

```tsx
import { Truck, FlaskConical, Users } from "lucide-react";

const infoCards = [
  {
    icon: Truck,
    title: "Same-Day Delivery",
    description:
      "Order before 7 PM for same-day delivery within our service area.",
  },
  {
    icon: FlaskConical,
    title: "Licensed & Lab-Tested",
    description:
      "Every product is tested by a certified California laboratory.",
  },
  {
    icon: Users,
    title: "Expert Guidance",
    description:
      "Our team helps you find the right product for your needs.",
  },
] as const;

export function InfoSection() {
  return (
    <section
      className="border-t border-neutral-100 bg-neutral-50 py-16"
      aria-labelledby="info-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="info-heading" className="sr-only">
          Why choose Dispensory
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {infoCards.map((card) => (
            <div key={card.title} className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <card.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{card.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/storefront/info-section.tsx
git commit -m "feat: add info section — delivery, lab-tested, expert guidance cards"
```

---

### Task 12: Shop Homepage — Assemble All Sections

**Files:**
- Create: `src/app/(storefront)/shop/page.tsx`
- Create: `src/components/storefront/product-grid-section.tsx`

- [ ] **Step 1: Create product grid section (reusable for Staff Picks / Popular)**

Create `src/components/storefront/product-grid-section.tsx`:

```tsx
import { ProductCard } from "./product-card";
import type { StorefrontProduct } from "@/types/storefront";
import Link from "next/link";

interface ProductGridSectionProps {
  title: string;
  viewAllHref?: string;
  products: StorefrontProduct[];
}

export function ProductGridSection({
  title,
  viewAllHref,
  products,
}: ProductGridSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12" aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2
            id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-2xl font-bold text-neutral-900"
          >
            {title}
          </h2>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            >
              View All →
            </Link>
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
```

- [ ] **Step 2: Create shop homepage with mock data for dev preview**

Create `src/app/(storefront)/shop/page.tsx`:

```tsx
import { HeroSection } from "@/components/storefront/hero-section";
import { CategoryGrid } from "@/components/storefront/category-grid";
import { InfoSection } from "@/components/storefront/info-section";
import { ProductGridSection } from "@/components/storefront/product-grid-section";
import type { StorefrontProduct } from "@/types/storefront";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse premium cannabis products — flower, vapes, edibles, concentrates, and more. Same-day pickup and delivery in Southern California.",
};

// Mock data for dev preview — will be replaced with real DB queries
const mockProducts: StorefrontProduct[] = [
  {
    id: "1",
    name: "Pacific Haze",
    slug: "pacific-haze-3-5g",
    brand: "SoCal Farms",
    category: "FLOWER",
    description: "A premium sativa-dominant hybrid with tropical notes.",
    unitPrice: 45,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "SATIVA",
    thcPercent: 28.5,
    cbdPercent: 0.1,
    terpenes: ["Myrcene", "Limonene", "Caryophyllene"],
    effects: [
      { effect: "ENERGY", intensity: 4 },
      { effect: "CREATIVITY", intensity: 3 },
      { effect: "FOCUS", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 24,
    isStaffPick: true,
    isNew: false,
    salePercent: null,
  },
  {
    id: "2",
    name: "Midnight Indica",
    slug: "midnight-indica-3-5g",
    brand: "Valley Greens",
    category: "FLOWER",
    description: "Deep body relaxation with earthy, piney undertones.",
    unitPrice: 38,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "INDICA",
    thcPercent: 24.2,
    cbdPercent: 0.8,
    terpenes: ["Myrcene", "Linalool"],
    effects: [
      { effect: "RELAXATION", intensity: 5 },
      { effect: "SLEEP", intensity: 4 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 18,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
  {
    id: "3",
    name: "Sunset Vape Cartridge",
    slug: "sunset-vape-cart-1g",
    brand: "Pacific Extracts",
    category: "VAPE",
    description: "Live resin cartridge with a smooth citrus profile.",
    unitPrice: 55,
    unitWeight: 1,
    unitOfMeasure: "gram",
    strainType: "HYBRID",
    thcPercent: 89.3,
    cbdPercent: null,
    terpenes: ["Limonene", "Terpinolene"],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "EUPHORIA", intensity: 4 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 32,
    isStaffPick: true,
    isNew: false,
    salePercent: 15,
  },
  {
    id: "4",
    name: "Bliss Gummies",
    slug: "bliss-gummies-100mg",
    brand: "Cali Confections",
    category: "EDIBLE",
    description: "Mixed berry gummies, 10mg THC each, 10 count.",
    unitPrice: 25,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: null,
    thcPercent: null,
    cbdPercent: null,
    terpenes: [],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "EUPHORIA", intensity: 2 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 50,
    isStaffPick: false,
    isNew: false,
    salePercent: 20,
  },
];

export default function ShopHomePage() {
  return (
    <>
      <HeroSection />

      <ProductGridSection
        title="Staff Picks"
        viewAllHref="/shop/menu?collection=staff-picks"
        products={mockProducts.filter((p) => p.isStaffPick)}
      />

      <ProductGridSection
        title="Popular Right Now"
        viewAllHref="/shop/menu?sort=popular"
        products={mockProducts}
      />

      <CategoryGrid />

      <InfoSection />
    </>
  );
}
```

- [ ] **Step 3: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS

- [ ] **Step 5: Run build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/(storefront)/shop/page.tsx src/components/storefront/product-grid-section.tsx
git commit -m "feat: add shop homepage — hero, staff picks, popular, categories, info sections with mock data"
```

---

## Chunk 4: Product Catalog Page + Quality Gates

### Task 13: Catalog Page with Filters

**Files:**
- Create: `src/app/(storefront)/shop/menu/page.tsx`

- [ ] **Step 1: Create the full catalog page with filter UI**

Create `src/app/(storefront)/shop/menu/page.tsx`:

```tsx
import { ProductCard } from "@/components/storefront/product-card";
import { EffectChip } from "@/components/storefront/effect-chip";
import { CATEGORY_LABELS, type StorefrontProduct } from "@/types/storefront";
import type { ProductCategory } from "@/generated/prisma/client";
import type { EffectKey } from "@/components/storefront/effect-colors";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse our full cannabis menu. Filter by category, strain type, effects, THC level, and more.",
};

// Reuse same mock data as homepage for now
// TODO: Replace with real DB query + search params filtering
const mockProducts: StorefrontProduct[] = [
  {
    id: "1",
    name: "Pacific Haze",
    slug: "pacific-haze-3-5g",
    brand: "SoCal Farms",
    category: "FLOWER",
    description: null,
    unitPrice: 45,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "SATIVA",
    thcPercent: 28.5,
    cbdPercent: 0.1,
    terpenes: ["Myrcene", "Limonene"],
    effects: [
      { effect: "ENERGY", intensity: 4 },
      { effect: "CREATIVITY", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 24,
    isStaffPick: true,
    isNew: false,
    salePercent: null,
  },
  {
    id: "2",
    name: "Midnight Indica",
    slug: "midnight-indica-3-5g",
    brand: "Valley Greens",
    category: "FLOWER",
    description: null,
    unitPrice: 38,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "INDICA",
    thcPercent: 24.2,
    cbdPercent: 0.8,
    terpenes: ["Myrcene", "Linalool"],
    effects: [
      { effect: "RELAXATION", intensity: 5 },
      { effect: "SLEEP", intensity: 4 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 18,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
  {
    id: "3",
    name: "Sunset Vape Cartridge",
    slug: "sunset-vape-cart-1g",
    brand: "Pacific Extracts",
    category: "VAPE",
    description: null,
    unitPrice: 55,
    unitWeight: 1,
    unitOfMeasure: "gram",
    strainType: "HYBRID",
    thcPercent: 89.3,
    cbdPercent: null,
    terpenes: ["Limonene"],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "EUPHORIA", intensity: 4 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 32,
    isStaffPick: true,
    isNew: false,
    salePercent: 15,
  },
  {
    id: "4",
    name: "Bliss Gummies",
    slug: "bliss-gummies-100mg",
    brand: "Cali Confections",
    category: "EDIBLE",
    description: null,
    unitPrice: 25,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: null,
    thcPercent: null,
    cbdPercent: null,
    terpenes: [],
    effects: [
      { effect: "RELAXATION", intensity: 3 },
      { effect: "EUPHORIA", intensity: 2 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 50,
    isStaffPick: false,
    isNew: false,
    salePercent: 20,
  },
  {
    id: "5",
    name: "Relief Topical Balm",
    slug: "relief-topical-balm-2oz",
    brand: "Heal Co",
    category: "TOPICAL",
    description: null,
    unitPrice: 32,
    unitWeight: null,
    unitOfMeasure: "each",
    strainType: null,
    thcPercent: null,
    cbdPercent: 15,
    terpenes: [],
    effects: [{ effect: "PAIN_RELIEF", intensity: 4 }],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 12,
    isStaffPick: false,
    isNew: true,
    salePercent: null,
  },
  {
    id: "6",
    name: "Focus Pre-Roll Pack",
    slug: "focus-pre-roll-5pk",
    brand: "SoCal Farms",
    category: "PRE_ROLL",
    description: null,
    unitPrice: 28,
    unitWeight: 3.5,
    unitOfMeasure: "gram",
    strainType: "SATIVA",
    thcPercent: 26.1,
    cbdPercent: null,
    terpenes: ["Terpinolene", "Pinene"],
    effects: [
      { effect: "FOCUS", intensity: 4 },
      { effect: "ENERGY", intensity: 3 },
    ],
    primaryImage: null,
    imageAlt: null,
    availableQuantity: 20,
    isStaffPick: false,
    isNew: false,
    salePercent: null,
  },
];

const filterCategories: ProductCategory[] = [
  "FLOWER",
  "VAPE",
  "EDIBLE",
  "CONCENTRATE",
  "PRE_ROLL",
  "TOPICAL",
  "TINCTURE",
  "ACCESSORY",
];

const filterEffects: EffectKey[] = [
  "RELAXATION",
  "FOCUS",
  "PAIN_RELIEF",
  "ENERGY",
  "SLEEP",
  "CREATIVITY",
];

const strainFilters = ["SATIVA", "INDICA", "HYBRID"] as const;

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    effect?: string;
    strain?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category;
  const activeEffect = params.effect;
  const activeStrain = params.strain;

  // Filter mock products based on search params
  let filtered = [...mockProducts];
  if (activeCategory) {
    filtered = filtered.filter((p) => p.category === activeCategory);
  }
  if (activeEffect) {
    filtered = filtered.filter((p) =>
      p.effects.some((e) => e.effect === activeEffect)
    );
  }
  if (activeStrain) {
    filtered = filtered.filter((p) => p.strainType === activeStrain);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Menu</h1>
        <p className="text-sm text-neutral-500">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter bar */}
      <div
        className="mt-6 space-y-4"
        role="search"
        aria-label="Product filters"
      >
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/shop/menu"
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              !activeCategory
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            All
          </Link>
          {filterCategories.map((cat) => (
            <Link
              key={cat}
              href={`/shop/menu?category=${cat}${activeEffect ? `&effect=${activeEffect}` : ""}${activeStrain ? `&strain=${activeStrain}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>

        {/* Strain type filters */}
        <div className="flex flex-wrap gap-2">
          {strainFilters.map((strain) => (
            <Link
              key={strain}
              href={`/shop/menu?${activeCategory ? `category=${activeCategory}&` : ""}strain=${strain}${activeEffect ? `&effect=${activeEffect}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStrain === strain
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {strain.charAt(0) + strain.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>

        {/* Effect filters */}
        <div className="flex flex-wrap gap-2">
          {filterEffects.map((effect) => (
            <EffectChip key={effect} effect={effect} size="sm" />
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-lg text-neutral-500">
            No products match your filters.
          </p>
          <Link
            href="/shop/menu"
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Clear all filters →
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/(storefront)/shop/menu/page.tsx
git commit -m "feat: add catalog page — category, strain, effect filters with URL-synced state and mock data"
```

---

### Task 14: Age Gate Denial Client Component

**Files:**
- Create: `src/app/(storefront)/age-verify/denial-handler.tsx`
- Modify: `src/app/(storefront)/age-verify/page.tsx`

- [ ] **Step 1: Create denial handler client component**

Create `src/app/(storefront)/age-verify/denial-handler.tsx`:

```tsx
"use client";

import { useState } from "react";

export function DenialHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const [denied, setDenied] = useState(false);

  if (denied) {
    return (
      <div className="text-center" role="alert">
        <p className="text-lg text-neutral-300">
          Sorry, you must be 21 or older to access this website.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          If you are 18 or older with a valid physician&apos;s recommendation,
          please visit us in store.
        </p>
      </div>
    );
  }

  return (
    <div>
      {children}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => setDenied(true)}
          className="w-full rounded-lg border border-neutral-700 px-8 py-3 text-base font-semibold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 sm:w-auto"
        >
          No
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update age gate page to use denial handler**

Replace the contents of `src/app/(storefront)/age-verify/page.tsx` to integrate the `DenialHandler` client component. The "Yes, Enter" button stays as a server action form, and the "No" button is handled by the client component's `DenialHandler`. Move the "No" button from the server markup into `DenialHandler`, and wrap the "Yes" form inside `DenialHandler`'s `children`.

Update the page: Remove the standalone "No" button from the server component. Wrap the form with `<DenialHandler>`. The `DenialHandler` receives the "Yes" form as children and adds the "No" button below.

```tsx
import { verifyAge } from "./actions";
import { DenialHandler } from "./denial-handler";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Age Verification",
  description: "You must be 21 or older to enter this website.",
};

export default function AgeVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return <AgeGateContent searchParams={searchParams} />;
}

async function AgeGateContent({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo || "/shop";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0a] px-4 text-white">
      <a
        href="#age-question"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to age verification
      </a>

      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Dispensory
        </h1>
        <div className="mx-auto mt-3 h-0.5 w-16 bg-emerald-500" />
        <p className="mt-3 text-sm tracking-widest text-neutral-400 uppercase">
          Southern California
        </p>

        <div id="age-question" className="mt-12" role="main" tabIndex={-1}>
          <p className="text-lg text-neutral-300">
            Are you 21 years of age or older?
          </p>

          <DenialHandler>
            <div className="mt-8 flex justify-center">
              <form
                action={async () => {
                  "use server";
                  await verifyAge(returnTo);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  Yes, Enter
                </button>
              </form>
            </div>
          </DenialHandler>
        </div>

        <footer className="mt-16 space-y-2 text-xs text-neutral-600">
          <p>
            This website contains content related to cannabis products. You must
            be 21 years of age or older to enter, or 18+ with a valid
            physician&apos;s recommendation.
          </p>
          <p>California Department of Cannabis Control Licensed Retailer</p>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/(storefront)/age-verify/denial-handler.tsx src/app/(storefront)/age-verify/page.tsx
git commit -m "feat: add age gate denial handler — polite message with medicinal guidance"
```

---

### Task 15: Run All Quality Gates

- [ ] **Step 1: Run type-check**

Run: `pnpm type-check`
Expected: 0 errors

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass (existing 33 + new age gate tests)

- [ ] **Step 4: Run build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Run dev server and visually verify**

Run: `pnpm dev`

Manually verify in browser:
1. `http://localhost:3000/shop` → Redirects to `/age-verify`
2. Click "Yes, Enter" → Sets cookie, redirects to `/shop`
3. `/shop` → Hero with rotating text, effect chips, product cards, categories, info section, footer
4. `/shop/menu` → Full catalog with filter chips
5. Click "No" on age gate → Shows denial message
6. Existing dashboard at `/` still works with auth

- [ ] **Step 6: Commit any lint/format fixes if needed**

```bash
pnpm format
git add -A
git commit -m "style: format storefront files"
```

---

### Task 16: Update Governance Files

**Files:**
- Modify: `HANDOFF.md`
- Modify: `AUDIT.md`
- Modify: `ProjectHealth.md`

- [ ] **Step 1: Update HANDOFF.md**

Update the "In Progress" section to reflect storefront foundation is built. Update "Code Changes Made This Session" with all new files. Update "Next Steps" to reflect Phase 2 (cart, checkout, customer auth, product detail page).

- [ ] **Step 2: Update AUDIT.md**

Add new test to Test Coverage section. Update quality gates with latest results.

- [ ] **Step 3: Update ProjectHealth.md**

Update codebase metrics (new file count, component count, page count). Update design continuity score.

- [ ] **Step 4: Commit governance updates**

```bash
git add HANDOFF.md AUDIT.md ProjectHealth.md
git commit -m "docs: update governance files — storefront foundation complete"
```

---

## Summary

**Total Tasks:** 16
**Total Steps:** ~60
**Commits:** ~14

**What this plan builds:**
1. Prisma schema extensions (ProductImage, ProductEffect, Collection, Customer/Order storefront fields)
2. Age gate with 30-day HttpOnly cookie + middleware integration
3. Storefront layout (frosted glass nav, dark footer with compliance badges)
4. Design tokens (effect colors, transitions, gradients)
5. Hero section with animated rotating text + gradient blobs
6. Product card component (strain badges, THC/CBD pills, effect chips, hover animations)
7. Category grid (8 categories with emoji icons)
8. Info section (delivery, lab-tested, expert guidance)
9. Shop homepage assembling all sections
10. Catalog page with category/strain/effect filters

**Deferred homepage sections (add in Phase 2 plan):**
- Deals Banner (gradient with deal tags)
- Featured Brands (horizontal scrollable row)
- Store Bar (sticky below nav with pickup/delivery toggle, live status)

**What's NOT in this plan (Phase 2):**
- Cart context + slide-out panel
- Product detail page
- Checkout flow
- Customer auth
- Order confirmation
- Real DB queries (currently using mock data)
- Search functionality
