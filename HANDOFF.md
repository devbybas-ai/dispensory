# Dispensory - Session Handoff

> Updated: 2026-03-16 | Session: 5 (in-progress)

---

## Current State

### In Progress (Session 5)

- **Customer-Facing Storefront** — Full e-commerce experience under `/shop`
  - Design spec approved: `docs/superpowers/specs/2026-03-16-storefront-design.md`
  - Design mockup: `public/mockup.html` (V4 — light theme, functional cart demo)
  - Aesthetic: Tech-forward clean (Leafly meets Stripe) with animated hero, gradient effects
  - Guided discovery via effect-based smart filters + curated collections
  - Full shopping cart with excise tax calculation
  - Pickup and delivery fulfillment
  - Optional customer accounts with guest checkout
  - 21+ age gate (full-page branded gate, 30-day cookie)
  - **Status: Spec approved, awaiting implementation plan**

- **VPS Deployment** — Deploy to dispensory.builtbybas.com
  - Deployment spec: `docs/superpowers/specs/2026-03-16-vps-deployment-design.md`
  - Pattern: Linux user `dispensory`, port 3006, PM2, Nginx, Certbot SSL
  - GitHub repo: `devbybas-ai/dispensory` (private) — not yet created
  - SSH + deploy keys needed for VPS
  - Database: `dispensory` DB + `dispensory_user` on existing PostgreSQL instance
  - Next.js only (Phase 1) — Redis/BullMQ/Socket.io disabled (graceful degradation)
  - `REDIS_URL` made optional in `src/lib/env.ts` for graceful degradation
  - **Status: Spec approved, GitHub + SSH setup pending, age gate blocks deploy**

- **Code Changes Made This Session**
  - `src/lib/env.ts` — `REDIS_URL` changed from required to optional
  - `public/mockup.html` — Storefront design mockup (not production code)

### Completed (Session 4)

- **Docker Compose**: `docker-compose.yml` for PostgreSQL 17 + Redis 7 with health checks
- **Interactive POS Cart Flow**: Full checkout pipeline
  - `cart-reducer.ts` -- Pure reducer with ADD_ITEM, UPDATE_QUANTITY, REMOVE_ITEM, SET_CUSTOMER, CLEAR actions
  - `pos-terminal.tsx` -- Main client component with useReducer, 3-column layout
  - `product-grid.tsx` -- Responsive product cards with "Add to Cart"
  - `cart-panel.tsx` -- Sticky sidebar with quantity controls, live tax calculation
  - `checkout-dialog.tsx` -- Dialog: order summary, payment method, cash tendered/change
  - `customer-search.tsx` -- Debounced customer lookup with dropdown results
  - `shift-controls.tsx` -- Open/close shift, cash drawer setup
- **CRUD Forms**: React-hook-form + Zod v4 + Dialog pattern
- **Search/Filter on List Views**: URL-synced, SSR-compatible
- **Integration Services** (all gracefully degrade when unconfigured)
- **Realtime Events Wired**: emitPOSEvent in createOrder, processPayment, voidOrder, openShift, closeShift
- **E2E Test Suite** (Playwright) — 5 test specs
- **Database Connected**: PostgreSQL 17 native, 33 tables, seed data loaded
- **All quality gates green**: lint (0), type-check (0), test (33/33), build (success)

### Completed (Sessions 1-3)

- Project scaffold, deps, config, security middleware, governance files
- 33-model schema, 19 enums, Auth.js v5 RBAC
- Seed script, dashboard UI (6 pages), delivery actions, finance reporting
- Receipt PDF, rate limiting, CI/CD pipeline

### Not Started

- Twilio SMS integration
- Mapbox/Google Maps integration (needed for delivery zone check)
- Online payment integration
- Full accessibility audit

---

## Blockers

- Node.js 20.18.0 is below Prisma 7's minimum (20.19+). Using Prisma 6 as workaround.
- Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. Current middleware still works.
- GitHub repo not yet created — blocks VPS deployment
- Age gate not yet implemented — blocks VPS deployment (compliance requirement)

---

## Decisions Made

| Decision | Reason | Date |
| --- | --- | --- |
| Storefront same app, new routes | Leverage existing product/inventory/tax data directly | 2026-03-16 |
| Tech-forward clean aesthetic | Client has budget, data-rich Leafly/Stripe feel with original flair | 2026-03-16 |
| Guided discovery + curated collections | Effect-based smart filters (MVP), editorial landing pages (Phase 2) | 2026-03-16 |
| Optional customer accounts | Guest checkout for conversion, account nudge for saved preferences | 2026-03-16 |
| Full-page 21+ age gate | First brand impression, 30-day persistent cookie, DCC compliance | 2026-03-16 |
| Extend existing models (not new) | Customer, Order, ProductMaster already exist — extend with storefront fields | 2026-03-16 |
| Package allocation at checkout | Track-and-trace compliance — SELECT FOR UPDATE prevents double-selling | 2026-03-16 |
| ONLINE_SYSTEM user for cashierId | Order.cashierId is non-nullable — system user for online orders | 2026-03-16 |
| PREMISES_ID env var | Online orders need premises association for compliance | 2026-03-16 |
| Cart in localStorage | Non-sensitive data (product IDs/quantities), explicitly permitted | 2026-03-16 |
| Deploy Next.js only (Phase 1) | Redis/BullMQ/Socket.io gracefully degrade, simplest deploy | 2026-03-16 |
| Port 3006 for VPS | Next available port on VPS (3000-3005 taken by other projects) | 2026-03-16 |
| GitHub under devbybas-ai | Dispensory is a BuiltByBas product, not a client brand | 2026-03-16 |
| Prisma 6 instead of 7 | Node 20.18.0 < Prisma 7 minimum 20.19+ | 2026-03-11 |
| Modular monolith over microservices | Five systems, one database -- simpler ops, shared transactions | 2026-03-11 |
| Per-client deployment model | Not SaaS/multi-tenant -- each client gets standalone instance | 2026-03-11 |
| Keep middleware.ts over proxy.ts | Auth.js depends on middleware pattern, migration can wait | 2026-03-11 |
| JWT sessions over DB sessions | Simpler, no DB lookup per request, 8-hour max covers a shift | 2026-03-11 |
| Edge-safe auth config split | Middleware runs in Edge, bcrypt/Prisma need Node.js | 2026-03-11 |
| Sales tax on subtotal + excise | California requires sales tax calculated on price incl. excise | 2026-03-11 |
| In-memory rate limit over Redis | Simpler for single-instance; swap to Redis for multi-instance | 2026-03-12 |
| Graceful degradation for services | Redis/S3/Resend return null when unconfigured, no crashes | 2026-03-12 |

---

## Key File Locations

| File/Dir | Purpose |
| --- | --- |
| `docs/superpowers/specs/2026-03-16-storefront-design.md` | Storefront design spec |
| `docs/superpowers/specs/2026-03-16-vps-deployment-design.md` | VPS deployment spec |
| `public/mockup.html` | Storefront design mockup (V4) |
| `prisma/schema.prisma` | 33-model database schema |
| `prisma/seed.ts` | Database seed script |
| `src/auth.ts` | Auth.js config with credentials provider |
| `src/auth.config.ts` | Edge-safe auth config (needs storefront public routes) |
| `src/middleware.ts` | Auth + security headers + CSRF |
| `src/lib/env.ts` | Environment validation (REDIS_URL now optional) |
| `src/domains/` | 5 domain modules (compliance, inventory, commerce, delivery, finance) |
| `src/app/(dashboard)/` | Staff dashboard (6 pages) |
| `e2e/` | Playwright E2E tests |
| `.github/workflows/ci.yml` | CI/CD pipeline |

---

## Next Steps

### Immediate (This Session)

1. Create GitHub repo (`devbybas-ai/dispensory`)
2. Generate SSH deploy keys for VPS
3. Create implementation plan for storefront (writing-plans skill)
4. Begin storefront implementation

### Priority 1: Storefront MVP

1. Age gate page + middleware
2. Storefront layout (nav, footer, cart provider)
3. Schema migrations (ProductMaster extensions, ProductImage, ProductEffect, Collection)
4. Shop homepage with animated hero
5. Product catalog with smart filters
6. Product detail page
7. Shopping cart (slide-out + full page)
8. Checkout flow (guest + authenticated)
9. Customer auth (separate from staff)
10. Order confirmation page

### Priority 2: Deployment

1. GitHub repo setup + SSH keys
2. VPS setup (Linux user, PM2, Nginx, Certbot)
3. DNS configuration
4. First deploy

### Priority 3: Polish

1. Full accessibility audit with axe-core
2. Performance profiling with real data
3. E2E tests for storefront flows

---

## Session History

| Session | Date | Focus | Key Outcomes |
| --- | --- | --- | --- |
| 1 | 2026-03-11 | Project setup | Scaffold, deps, config, security, governance, quality gates, memory |
| 2 | 2026-03-11 | Schema + Auth + Core Modules | 33-model schema, auth RBAC, compliance, inventory state machine, POS + tax engine |
| 3 | 2026-03-12 | Seed + UI + Domain + CI/CD | Seed script, dashboard UI (6 pages), delivery actions, finance reporting, receipt PDF, rate limit, CI/CD |
| 4 | 2026-03-12 | DB + UI + Integrations + Hardening | Docker compose, POS cart flow, CRUD forms, search/filter, S3/Socket.io/BullMQ/Resend, E2E tests, a11y, loading skeletons |
| 5 | 2026-03-16 | Storefront Design + Deployment Spec | Customer storefront design (tech-forward, age gate, guided discovery, cart), VPS deployment spec, REDIS_URL optional |
