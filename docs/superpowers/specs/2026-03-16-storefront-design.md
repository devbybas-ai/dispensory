# Dispensory Storefront Design Spec

> Date: 2026-03-16
> Status: Approved
> Mockup: public/mockup.html (V4 — light theme, functional cart)

---

## Overview

Add a customer-facing e-commerce storefront to the existing Dispensory app. Same codebase, new routes under `/shop`. Combines guided discovery (effect-based smart filters) with curated collections, data-rich product cards, and a fully functional shopping cart with pickup and delivery fulfillment.

**Aesthetic:** Tech-forward clean (Leafly meets Stripe) with original design flair — animated hero, gradient effects, micro-interactions. Light theme, high readability.

**Compliance:** 21+ age gate before any content loads. California DCC licensed, track-and-trace aware, excise tax calculated, daily purchase limits enforced.

---

## Decisions Log

| Question | Answer |
|----------|--------|
| Architecture | Same app, new routes under `/shop` |
| Customer experience | Guided discovery (smart filters) + curated collections |
| Fulfillment | Both pickup and delivery |
| Aesthetic | Tech-forward clean — light background, data-rich, animated hero |
| Discovery flow | Smart effect-based filter chips (MVP), editorial landing pages (Phase 2) |
| Accounts | Optional — guest checkout available, nudge to save preferences |
| Age gate | Full-page branded gate, 30-day persistent cookie |

---

## Route Structure

### Public (age gate only, no auth)

| Route | Purpose |
|-------|---------|
| `/age-verify` | 21+ full-page age gate |
| `/shop` | Homepage: hero + effect filters + collections + categories |
| `/shop/menu` | Full product catalog with smart filters |
| `/shop/menu/[slug]` | Product detail page |
| `/shop/cart` | Cart review page |
| `/shop/checkout` | Guest or authenticated checkout |
| `/shop/order/[id]` | Order confirmation + tracking |

### Customer Account (optional auth)

| Route | Purpose |
|-------|---------|
| `/shop/account` | Profile, preferences, delivery addresses |
| `/shop/account/orders` | Order history with reorder |

### Staff (existing, unchanged)

| Route | Purpose |
|-------|---------|
| `/login` | Staff login |
| `/(dashboard)/*` | All existing dashboard routes |

### Route Group

Use `src/app/(storefront)/` for all `/shop` and `/age-verify` routes. The existing empty `src/app/(public)/` group is not used — storefront needs its own layout with nav, footer, and cart provider.

---

## Auth & Middleware Changes

### Public Route Registration

The existing `src/auth.config.ts` blocks ALL non-login routes for unauthenticated users. The following routes must be added to `publicRoutes`:

```
/age-verify
/shop
/shop/menu
/shop/cart
/shop/checkout
/shop/order
/api/shop
```

The `authorized` callback must be refactored to distinguish three route zones:
1. **Staff routes** (`/(dashboard)/*`) — Require staff auth (existing behavior)
2. **Customer account routes** (`/shop/account/*`) — Require customer auth
3. **Public storefront routes** (`/shop/*`, `/age-verify`) — No auth required

### Age Gate (middleware-level, server-side only)

- Check runs in middleware (server-side) — `HttpOnly` cookie is readable server-side
- No `age_verified` cookie → redirect to `/age-verify`
- Applies to ALL `/shop/*` routes
- Cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, 30-day expiry
- `/age-verify` itself is exempt from the check

### CSP Header Updates

The existing CSP in `src/middleware.ts` must be updated:
- Add S3 bucket domain to `img-src` for product images
- Add Maps API domain to `script-src` and `connect-src` if delivery address uses maps

---

## Page Designs

### 1. Age Gate (`/age-verify`)

- Full-page, dark background (#0a0a0a)
- Centered: Dispensory logo, green accent line, "Southern California" tagline
- Question: "Are you 21 years of age or older?"
- Two buttons: "Yes, Enter" (green) / "No" (ghost)
- Legal text: DCC compliance, 18+ medical with recommendation
- **Yes** → Set 30-day cookie via server action, redirect to `/shop` (or original destination)
- **No** → Show polite "Sorry" message, no cookie, cannot proceed
- Cannot be bypassed via direct URL navigation

### 2. Shop Homepage (`/shop`)

**Nav (sticky, frosted glass):**
- Logo: "Dispensory" (bold, left)
- Links: Menu, Deals, Brands, About
- Right: Search icon, Cart icon (with count badge), Sign In button
- Frosted glass background with blur

**Hero (full viewport height):**
- Soft green gradient background with floating gradient blobs (green, indigo, amber)
- Dot grid overlay for texture
- Animated badge: pulsing green dot + "Open Now · Pickup & Delivery Available"
- Animated heading: "Looking for" + rotating gradient text cycling through: "relaxation?", "better sleep?", "pain relief?", "creative energy?", "sharp focus?", "a good time?"
- Subtitle: "Tell us how you want to feel. We'll match you with the perfect product from over 200 items in stock."
- Effect chips: Relaxation (green), Focus (indigo), Pain Relief (pink), Energy (amber), Sleep (purple), Creativity (orange) — white background, colored border, fill + glow on hover
- Search bar with placeholder and keyboard shortcut hint (`/`)
- Parallax scroll effect — hero fades and drifts up as user scrolls (disabled when `prefers-reduced-motion`)
- Scroll indicator arrow at bottom

**Store Bar (sticky below nav):**
- Pickup/Delivery toggle
- Live status: pulsing green dot + "Open · Closes 10 PM" + star rating
- Filter chips: Strain Type, Price, THC %, Brand, Effects

**Deals Banner:**
- Soft gradient background (green to purple)
- "Today's Deals" + deal tags (e.g., "20% Off All Edibles", "BOGO Pre-Rolls")

**Staff Picks Section:**
- Section header with "View All" link
- 4-column product card grid
- Data-rich cards (see Product Card spec below)

**Popular Right Now Section:**
- Same layout as Staff Picks
- Trending products

**Shop by Category:**
- 8-column grid of category cards
- Each: emoji icon + name + item count
- Categories: Flower, Vapes, Edibles, Concentrates, Pre-Rolls, Topicals, Tinctures, Accessories
- Note: Beverages are categorized under Edibles in the `ProductCategory` enum
- Green highlight on hover

**Featured Brands:**
- Horizontal scrollable row
- Brand cards: avatar image + name + product count

**Info Section:**
- 3-column grid: Same-Day Delivery, Licensed & Lab-Tested, Expert Guidance

**Footer:**
- Dark background (#111)
- Logo + tagline
- Link columns: Shop, Company, Support
- Compliance badges: DCC Licensed, Lab Tested, Track & Trace, 21+
- License number

### 3. Product Card (used throughout)

Each product card displays:

- **Image** — Product photo, subtle zoom on hover
- **Badge** — Staff Pick (green), New (indigo), Sale/% Off (red), Trending (amber)
- **Favorite heart** — Appears on hover, top-right
- **Strain type** — Color-coded badge: Sativa (gold/amber), Indica (purple), Hybrid (green)
- **Rating** — Star + number + review count (Phase 2 — placeholder for now)
- **Brand name** — Subtle gray text (from `ProductMaster.brand` or `Vendor.name`)
- **Product name** — Bold, prominent
- **Stats** — THC % and CBD % in pill badges (from `Batch.thcPercent`, `Batch.cbdPercent`)
- **Terpenes** — Listed by name (from `Batch.terpeneProfile` JSON)
- **Effects** — Color-coded tags matching the effect chip colors
- **Price** — Bold, with unit (e.g., "/ 3.5g"). Sale items show strikethrough original price
- **Add to Cart button** — Black, turns green on hover

### 4. Shopping Cart (slide-out panel)

- Triggered by cart icon click in nav
- Slides in from right with overlay backdrop
- Header: "Your Cart" + close button
- Empty state: bag icon + "Your cart is empty" message
- Each item: product image, name, brand, quantity controls (+/-), remove button, line total
- Footer: Subtotal, Excise Tax (15%), Estimated Total
- "Proceed to Checkout" button (green)
- Tax notice: "Final taxes calculated at checkout. 21+ only."
- Focus trap when open (a11y)

### 5. Product Detail Page (`/shop/menu/[slug]`) — MVP

- Large product image(s)
- Full product data: name, brand, strain type, THC/CBD %, terpenes, effects
- Description
- Lab results / COA link (from `Batch.coaUrl`)
- Price + Add to Cart with quantity selector
- Available quantity indicator
- Related products section

### 6. Full Catalog (`/shop/menu`) — MVP

- Same store bar with filters at top
- Grid of product cards (responsive: 4 col → 3 → 2 → 1)
- Filters: Category, Strain Type, Effects, Price Range, THC %, Brand
- Sort: Popular, Price Low-High, Price High-Low, THC %, Newest
- Search with instant results
- Pagination or infinite scroll

### 7. Cart Page (`/shop/cart`) — MVP

- Full-page version of cart slide-out
- Line items with quantity controls
- Tax breakdown (excise + sales + local cannabis tax)
- Fulfillment selection: Pickup vs Delivery
- Purchase limit indicator (28.5g flower / 8g concentrate daily limit)
- Continue to Checkout button

### 8. Checkout (`/shop/checkout`) — MVP

- Guest checkout OR sign in
- Contact info: name, email, phone (required for compliance)
- Fulfillment: Pickup (select time) or Delivery (address, delivery window)
- Age verification acknowledgment checkbox
- Order summary with full tax breakdown
- Purchase limit validation (California DCC: 28.5g non-concentrate, 8g concentrate per day)
- Payment (Phase 2 — for now, "Pay at Pickup/Delivery")
- CAPTCHA / bot protection on guest checkout submission
- Place Order button

---

## Data Model Changes

### Extend Customer (existing model)

The `Customer` model already exists in `prisma/schema.prisma` (line 484). Add these fields:

```
// Storefront extensions
passwordHash    String?   // For online account (null = guest/walk-in only)
slug            String?   @unique  // URL-friendly identifier
preferences     Json?     // Saved effect preferences from guided discovery
emailVerified   Boolean   @default(false)

// Relations (new)
addresses       CustomerAddress[]
```

Note: `dateOfBirth` is already required on Customer — this is correct for compliance. The age gate cookie handles website access; DOB on Customer is for in-person ID verification records.

### CustomerAddress (new model)

```
model CustomerAddress {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])

  label       String?  // "Home", "Work", etc.
  street      String
  unit        String?
  city        String
  state       String   @default("CA")
  zip         String
  isDefault   Boolean  @default(false)
  inDeliveryZone Boolean @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
}
```

### Extend Order (existing model)

The `Order` model already exists (line 795). Add these fields:

```
// Storefront extensions
channel         OrderChannel  @default(POS)     // POS | ONLINE
fulfillmentType FulfillmentType? // PICKUP | DELIVERY (null for POS walk-ins)
customerEmail   String?        // For guest orders (no Customer record)
customerPhone   String?
pickupTime      DateTime?
onlineStatus    OnlineOrderStatus? // SUBMITTED -> CONFIRMED -> PREPARING -> READY -> COMPLETED
```

**Critical: `cashierId` is required and non-nullable.** For online orders, use a system user (e.g., "ONLINE_SYSTEM") as the cashier. When staff picks up the order for preparation, they can be re-assigned. This maintains the existing audit trail requirement.

**Critical: `premisesId` is required.** The storefront must be configured with a `PREMISES_ID` env var that associates all online orders with the correct premises. Add to `src/lib/env.ts`:
```
PREMISES_ID: z.string().min(1).optional(), // Required for storefront
```

### New Enums

```
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

### OrderLine (existing — no changes)

The existing `OrderLine` model already has `packageId` (required for track-and-trace compliance). **Online orders must allocate specific packages at checkout time**, not at cart time. This maintains the chain of custody required by California DCC and Metrc.

### Extend ProductMaster (existing model)

The `ProductMaster` model (line 579) needs storefront fields:

```
// Storefront extensions
slug            String?   @unique  // URL-friendly: "pacific-haze-3-5g"
strainType      StrainType?        // SATIVA, INDICA, HYBRID
isPublished     Boolean   @default(false) // Visible on storefront
images          ProductImage[]
effects         ProductEffect[]
storefrontOrder Int?               // Sort order on storefront
```

### New Enum: StrainType

```
enum StrainType {
  SATIVA
  INDICA
  HYBRID
}
```

### ProductImage (new model)

```
model ProductImage {
  id              String        @id @default(cuid())
  productMasterId String
  productMaster   ProductMaster @relation(fields: [productMasterId], references: [id])

  url       String   // S3 URL
  alt       String?
  sortOrder Int      @default(0)
  isPrimary Boolean  @default(false)

  createdAt DateTime @default(now())

  @@index([productMasterId])
}
```

### ProductEffect (new join table)

```
model ProductEffect {
  id              String        @id @default(cuid())
  productMasterId String
  productMaster   ProductMaster @relation(fields: [productMasterId], references: [id])

  effect    EffectType
  intensity Int        @default(3) // 1-5 scale

  @@unique([productMasterId, effect])
  @@index([effect])
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
```

### Collection (new model)

```
model Collection {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  description String?
  type        CollectionType
  isActive    Boolean        @default(true)
  sortOrder   Int            @default(0)

  products    CollectionProduct[]

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model CollectionProduct {
  id              String        @id @default(cuid())
  collectionId    String
  collection      Collection    @relation(fields: [collectionId], references: [id])
  productMasterId String
  sortOrder       Int           @default(0)

  @@unique([collectionId, productMasterId])
  @@index([collectionId])
}

enum CollectionType {
  STAFF_PICKS
  POPULAR
  DEALS
  NEW_ARRIVALS
  CUSTOM
}
```

---

## Storefront Product View

Products on the storefront are assembled from multiple models:

```
ProductMaster (name, brand, category, price, description, slug, strainType)
  → Batch (thcPercent, cbdPercent, terpeneProfile, coaUrl) — latest passing batch
  → Package (quantity, state=AVAILABLE) — sum for stock count
  → ProductImage (url, alt) — for display
  → ProductEffect (effect, intensity) — for discovery/filtering
```

A server-side query joins these for the storefront view. Products are only shown if:
- `isPublished = true`
- `complianceStatus = APPROVED`
- At least one `Package` with `state = AVAILABLE` and `quantity > 0`
- Associated `Batch` has `testingStatus = PASSED`

---

## Effect System

Effects are the core of the guided discovery experience. Each `ProductMaster` can have multiple `ProductEffect` entries.

**Standard effects with colors:**

| Effect | Color | Hex |
|--------|-------|-----|
| Relaxation | Green | #059669 |
| Focus | Indigo | #4f46e5 |
| Pain Relief | Pink | #db2777 |
| Energy | Amber | #d97706 |
| Sleep | Purple | #7c3aed |
| Creativity | Orange | #ea580c |
| Euphoria | Amber | #d97706 |

Used for: homepage chips, product cards, menu filters, saved preferences.

---

## Inventory & Availability

### Product Availability

A product is "in stock" when:
- Sum of `Package.quantity` where `Package.state = AVAILABLE` for any batch of that `ProductMaster` > 0
- The product card shows available quantity (or "In Stock" / "Low Stock" / "Out of Stock")

### Inventory Reservation

- **Cart time:** No reservation. Cart is client-side only. Products may go out of stock between add-to-cart and checkout.
- **Checkout time:** When customer submits order, server-side transaction:
  1. Lock relevant packages (`SELECT FOR UPDATE`)
  2. Check availability — if insufficient, return error with updated stock
  3. Allocate specific packages (FIFO by `Batch.manufacturingDate`)
  4. Set `Package.state = RESERVED`
  5. Create `OrderLine` entries with `packageId`
  6. If order is cancelled/abandoned, release reservation (cron job: release after 30 min)

This maintains track-and-trace compliance: every sale links to specific packages.

### Race Condition Handling

- PostgreSQL row-level locks (`SELECT FOR UPDATE`) prevent double-selling
- If stock is insufficient at checkout, the customer sees a clear error: "Sorry, [Product Name] is no longer available in the requested quantity. X remaining."
- Cart page shows real-time stock when loaded (not cached)

---

## Purchase Limits (California DCC)

California daily purchase limits per customer:
- **28.5 grams** of non-concentrated cannabis (flower, pre-rolls)
- **8 grams** of concentrated cannabis (concentrates, vapes)
- Edibles and topicals have separate packaging limits

Enforcement:
- Cart validates limits in real-time as items are added
- Checkout validates again server-side
- For guest checkout, limits apply per order (no cross-order tracking)
- For logged-in customers, check same-day orders against limits

---

## Fulfillment

### Pickup
- Customer selects pickup time window (30-min slots)
- Order goes to staff dashboard — new "Online Orders" queue
- Staff prepares order, marks Ready
- Customer picks up, staff verifies ID (21+)
- Staff assigns themselves as cashier at pickup

### Delivery
- Customer enters delivery address
- Delivery zone check (local ordinance radius)
- Order goes to delivery dispatch queue (existing delivery domain)
- Links to existing `DeliveryStop` model via `Order.deliveryStopId`
- Driver assigned, customer gets order status page
- ID verification at door (21+)
- Proof of delivery captured

---

## Tax Calculation

Cannabis tax in California (as of 2026):

| Tax | Rate | Applied To |
|-----|------|-----------|
| Cannabis Excise Tax | 15% | Retail price (collected from purchaser) |
| State Sales Tax | 7.25% base | Retail price + excise tax |
| Local Sales Tax | Varies by city | Retail price + excise tax |
| Local Cannabis Tax | Varies by city | Varies (per unit, % of gross, etc.) |

Tax engine already exists in `src/domains/finance/`. Storefront checkout calls the same `TaxLine` creation service. Cart shows estimated excise tax only; full breakdown at checkout.

---

## Error States & Failure Modes

Per Pillar 8 (R3S — What happens when something fails?):

| Scenario | Behavior |
|----------|----------|
| Product out of stock at checkout | Clear error message, updated stock shown, suggest alternatives |
| Store closed (outside 6AM-10PM) | Store bar shows "Closed · Opens at 6 AM". Browsing allowed, checkout disabled with message |
| License suspended | All storefront pages show maintenance page. No browsing, no ordering. Staff dashboard still accessible |
| Delivery zone not covered | Address form shows "Delivery not available to this address. Try pickup instead." |
| Checkout validation failure | Inline errors on form fields, order not submitted |
| Network failure during checkout | Order creation is idempotent (client generates idempotency key). Safe to retry |
| Cart items become unavailable | Cart page refresh checks stock, shows warning badges on unavailable items |
| Purchase limit exceeded | Cart shows limit indicator, checkout blocks with clear message |

---

## Security & Rate Limiting

### Rate Limits (using existing `src/lib/rate-limit.ts`)

| Endpoint | Limit |
|----------|-------|
| Product search/listing | 60 req/min per IP |
| Add to cart (API) | 30 req/min per IP |
| Checkout submission | 5 req/min per IP |
| Account creation | 3 req/min per IP |
| Age verification | 10 req/min per IP |

### Bot Protection

- CAPTCHA (or equivalent) required on guest checkout submission
- CAPTCHA on account creation
- Not required for browsing or cart operations

### Cart in localStorage

Cart contents (product IDs, quantities) are stored in `localStorage` for persistence. This is **explicitly permitted** — cart data is non-sensitive product references, not tokens or secrets. The CLAUDE.md prohibition on localStorage applies to auth tokens and session data only.

---

## Phase 2 Features (Not MVP)

- Online payment integration (currently pay at pickup/delivery)
- AI-powered product recommendations based on purchase history
- Editorial category landing pages ("New to Cannabis?", "Looking for Relief")
- Customer reviews and ratings (currently using placeholder data)
- Loyalty program / points
- Wishlist / saved favorites
- Reorder from order history
- Push notifications for order status
- SMS order updates (Twilio integration exists)

---

## Technical Implementation Notes

### Storefront Layout
- New layout at `src/app/(storefront)/layout.tsx`
- Shares root layout but has its own nav, footer, cart provider
- No sidebar — full-width pages
- Existing `src/app/(public)/` group is unused — storefront has its own layout needs

### Cart State
- React Context + localStorage for persistence
- Cart survives page refreshes and browser close
- Syncs to server on checkout (not before — reduces API calls)
- Stock validation happens on cart page load and at checkout

### Product Images
- Stored in S3 (existing S3 integration)
- `ProductImage` model stores URLs
- Served through Next.js Image component with optimization
- Fallback placeholder for products without images

### Customer Auth
- Separate Auth.js credentials provider for customers
- Email + password registration
- Session cookie (same mechanism as staff, different role)
- Staff cannot log in through storefront and vice versa
- `publicRoutes` in `auth.config.ts` must be updated

### Premises Configuration
- `PREMISES_ID` env var associates all online orders with the correct premises
- System user `ONLINE_SYSTEM` used as cashier for online orders
- Staff re-assigned when they pick up the order for preparation

### Performance
- Server components for product listing (SSR with caching)
- Client-side cart (no server round-trips while browsing)
- Image optimization through Next.js
- Lazy loading for below-fold sections

### Accessibility
- All existing a11y standards apply (skip links, ARIA, focus management)
- Cart slide-out traps focus when open
- Effect chips are keyboard navigable
- Color is never the only indicator (text labels always present)
- Reduced motion: disable parallax and animations when `prefers-reduced-motion`
