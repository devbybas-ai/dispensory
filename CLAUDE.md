# Dispensory - Project Instructions

> **Tech Stack: LOCKED** (approved 2026-03-11)
> Changes require documented justification in HANDOFF.md + user approval.

---

## Project Overview

**Dispensory** is a compliance-first dispensary management platform for Southern California. It runs a cannabis retail business end-to-end while staying inside California DCC, CDTFA, and local city/county regulations. Built as five systems sharing one database.

**Client project** -- each deployment is a standalone system for a specific dispensary client.

---

## Tech Stack (LOCKED)

| Layer        | Choice                      |
| ------------ | --------------------------- |
| Language     | TypeScript (strict mode)    |
| Framework    | Next.js 15 (App Router)     |
| Styling      | Tailwind CSS + shadcn/ui    |
| Database     | PostgreSQL 17 (self-hosted) |
| ORM          | Prisma 6                    |
| Auth         | Auth.js (NextAuth v5)       |
| Validation   | Zod                         |
| Testing      | Vitest + Playwright         |
| Package Mgr  | pnpm                        |
| Linting      | ESLint + Prettier           |
| CI/CD        | GitHub Actions              |
| Real-time    | Socket.io                   |
| Job Queues   | BullMQ + Redis              |
| File Storage | S3-compatible               |
| Email        | Resend                      |
| SMS          | Twilio                      |
| Maps         | Mapbox or Google Maps API   |
| PDF          | @react-pdf/renderer         |
| Spreadsheets | exceljs                     |
| Scanning     | html5-qrcode                |
| Barcode Gen  | bwip-js                     |

---

## Architecture: Modular Monolith

Five systems, one PostgreSQL database:

```
src/domains/
  compliance/    -- Licensing, local rules, facility, employee, audit
  inventory/     -- Vendor, receiving, catalog, inventory, recall, waste
  commerce/      -- Customer, menu, POS, marketing
  delivery/      -- Dispatch, driver, proof-of-delivery, returns
  finance/       -- Payments, tax, accounting, reports
```

---

## Standards

This project follows the **BuiltByBas Dev Studio Bible** (`.claude/BuiltByBasProjectSetup.md`).

### The Eight Pillars

1. **Security Minded** -- Can this be exploited?
2. **Structure** -- Can someone else pick this up tomorrow?
3. **Performance** -- Does this respect the user's time and device?
4. **Inclusive** -- Can everyone use this?
5. **Non-Bias** -- Does this assume or exclude?
6. **UX Minded** -- Does this feel intentional and clear?
7. **Universal Design** -- Does this work for the widest range of people?
8. **R3S** -- What happens when something fails?

### Conflict Resolution

- Security > Performance > Convenience
- Accessibility > Aesthetics
- Data Privacy > Feature Completeness

---

## Prohibited Actions

- Never force-push to any shared branch
- Never commit `.env` or secrets
- Never inject user-supplied data as raw HTML
- Never use `any` type or unsafe type bypasses
- Never pass raw request body to database operations
- Never store tokens in localStorage/sessionStorage
- Never expose server keys to client bundles
- Never skip auth checks on protected routes
- Never delete user data without confirmation
- Never log PII (names, emails, phone numbers, ages)
- Never ship without passing quality gates
- Never use `eval()`, `exec()`, `new Function()` with any input
- Never skip hooks or bypass safety checks (`--no-verify`)
- Never use `@ts-ignore` without documented justification
- Never modify archived content in `archive/` directories

---

## Scripts

```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm lint             # Lint (0 errors required)
pnpm format:check     # Check formatting
pnpm type-check       # TypeScript check
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to DB
pnpm db:migrate       # Create migration
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
```

---

## Commit Conventions

```
Format: <type>: <description>
Types:  feat, fix, docs, style, refactor, test, build, chore
Footer: Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Code Quality Gates (All Must Pass)

1. `pnpm type-check` -- 0 errors
2. `pnpm lint` -- 0 errors
3. `pnpm test` -- All passing
4. `pnpm build` -- 0 errors

---

## Session Protocol

### Starting a Session

1. Read `HANDOFF.md` for current state
2. Read `AUDIT.md` for open issues
3. Read `ProjectHealth.md` for overall health
4. Check AI memory files
5. Run tests to confirm baseline
6. State understanding and plan

### During a Session

- Follow the Eight Pillars on every line of code
- Mark todos complete as work progresses
- Log new issues in `AUDIT.md` immediately
- Test before and after changes

### Ending a Session

1. Update `HANDOFF.md`
2. Update `AUDIT.md`
3. Update `ProjectHealth.md`
4. Run full test suite + build
5. Recommend next steps

---

## Governance Files

| File                                | Purpose                                      |
| ----------------------------------- | -------------------------------------------- |
| `CLAUDE.md`                         | Project instructions (this file)             |
| `HANDOFF.md`                        | Session continuity tracker                   |
| `AUDIT.md`                          | Quality, issues, tech debt, security posture |
| `ProjectHealth.md`                  | Health summary and production readiness      |
| `.env.example`                      | Environment variable template                |
| `.claude/BuiltByBasProjectSetup.md` | Full standards reference                     |

---

## Industry-Specific: Cannabis Compliance

This is NOT a normal retail app. Every module must be:

- **License-aware** -- DCC license status gates all operations
- **Locality-aware** -- Local ordinances override state defaults
- **Tax-aware** -- Excise tax, sales tax, local cannabis tax are separate
- **Track-and-trace-aware** -- Every package/gram auditable
- **Audit-ready** -- Every state change logged with who/what/when/where

Key California compliance requirements:

- DCC license required per premises
- Local authorization required on top of state license
- CCTT/Metrc track-and-trace integration
- 15% cannabis excise tax collected from purchasers (no vendor compensation as of Jan 1, 2026)
- CDTFA electronic filing monthly
- Age verification: 21+ adult-use, 18+ medicinal with recommendation
- Retail hours: 6:00 AM - 10:00 PM (state), local may be stricter
- No products/packaging/marketing attractive to children or persons under 21
