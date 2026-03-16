# BuiltByBas Project Health

> **The Dev Studio Bible — Setup, Standards, Health & Audit Framework**
> Version 3.0 | Created: 2026-03-06
> Author: Bas Rosario

---

---

# PART I: AI-Guided Project Setup

When this file is present in a project directory and the user asks for help setting up or starting a project, follow the workflow below exactly. Do not skip steps. Do not assume answers.

---

## Step 0: Greet the User

Display the following greeting in chat before doing anything else:

```
=============================================
      BuiltByBas Project Health
      Setup & Standards Framework
---------------------------------------------
      Brought to you by BuiltByBas
      builtbybas.com
=============================================
```

Then say: _"Let's get your project set up right. I'm going to ask a few questions so I can recommend the best environment for what you're building. Don't worry -- you'll be able to review and change any part of the stack before we proceed."_

---

## Step 1: Understand the Project

Ask the user the following questions. Wait for answers before proceeding. Adapt follow-ups based on their responses.

**Required questions:**

1. What kind of project are you building? (e.g., website, web app, API, mobile app, CLI tool, desktop app, library/package, data pipeline, game, other)
2. Can you describe the project in a few sentences? What problem does it solve or what is its purpose?
3. Who is the target audience? (e.g., general public, business clients, internal team, children/families, developers)
4. Do you have any specific features or requirements in mind already? (e.g., user authentication, payments, CMS, real-time updates, multilingual, AI integration)
5. Is this a personal project, client project, or open-source? Does it need to generate revenue?
6. Do you have any tech stack preferences or constraints? (e.g., "I want to use Python", "it needs to run on WordPress", "no preference -- you decide")

**If the user provides detailed answers, skip questions they already answered. If they are unsure, help them think through it.**

---

## Step 2: Recommend a Tech Stack

Based on the answers from Step 1, recommend a complete tech stack. For each choice, explain **why** it was chosen for this specific project. Cover:

- **Language** (e.g., TypeScript, Python, Go, Rust)
- **Framework** (e.g., Next.js, Django, Express, SvelteKit, Astro, Flask)
- **Styling** (e.g., Tailwind CSS, CSS Modules, styled-components, vanilla CSS)
- **Database** (e.g., PostgreSQL self-hosted, SQLite, MongoDB, none -- PostgreSQL is the default for all web apps)
- **Authentication** (e.g., Auth.js/NextAuth, Clerk, custom, none)
- **Testing** (e.g., Vitest, Jest, Pytest, Playwright)
- **Package manager** (e.g., pnpm, npm, yarn, pip, cargo)
- **Linting & formatting** (e.g., ESLint + Prettier, Ruff, Clippy)
- **Version control** (Git -- always)
- **CI/CD** (if applicable)
- **Additional tools** (anything project-specific: CMS, email service, payment processor, AI SDK, etc.)

Present the recommendation as a clear table. Then ask: _"Would you like to make any changes to this stack, or does this look good?"_

Wait for approval or adjustments before proceeding.

---

## Step 3: Hosting & Deployment

Ask the user about their hosting plans:

1. Where do you plan to host this project? Options:
   - **VPS** (e.g., DigitalOcean, Linode, Hetzner, your own server)
   - **Platform-as-a-Service** (e.g., Vercel, Netlify, Railway, Render, Fly.io)
   - **Private physical server** (self-hosted hardware)
   - **Cloud provider** (e.g., AWS, GCP, Azure)
   - **Not sure yet** -- that's fine
2. Do you own a domain name for this project, or will you need one?
3. Do you have any budget constraints for hosting?

**Important -- always advise the user:**

> "While in development, your local environment and local dev servers are all you need. We won't worry about production hosting until testing in a production-like environment is required. For now, everything runs on your machine."

If the user selects VPS or physical server, note that the Infrastructure Security standards (Part II, Section A.11) will apply at deployment time.

---

## Step 4: Final Setup Configuration

Once all questions are answered, print a **Final Setup Configuration** summary for the user to review:

```
=============================================
      BuiltByBas Project Health
      Final Setup Configuration
=============================================

PROJECT
  Name:           [project name]
  Type:           [website / web app / API / etc.]
  Description:    [brief description]
  Audience:       [target audience]
  Scope:          [personal / client / open-source]

TECH STACK (LOCKED after approval)
  Language:       [chosen language]
  Framework:      [chosen framework]
  Styling:        [chosen styling approach]
  Database:       [chosen database or "none"]
  Auth:           [chosen auth or "none"]
  Testing:        [chosen test framework]
  Package Mgr:    [chosen package manager]
  Linting:        [chosen linter + formatter]
  Version Control: Git

HOSTING (production -- not needed yet)
  Target:         [VPS / PaaS / physical / cloud / TBD]
  Domain:         [domain or TBD]

ADDITIONAL TOOLS
  [any extras noted during conversation]

STANDARDS APPLIED
  This project follows the BuiltByBas Dev
  Studio Bible (Part II of this document).

NOTE: Development will use local dev servers
until production testing is required.

=============================================
```

Then ask: _"Does this configuration look correct? Say 'approved' to proceed, or let me know what you'd like to change."_

**Do not proceed until the user explicitly approves.**

**Once approved, the tech stack is LOCKED.** Changing any layer after approval requires documented justification in HANDOFF.md with the reason for the change and the user's explicit approval.

---

## Step 5: Set Up the Project

Once approved, the AI should:

1. **Initialize the project** -- Scaffold using the chosen framework's recommended method
2. **Install dependencies** -- All production and dev dependencies from the approved stack
3. **Configure linting & formatting** -- Strict rules aligned with the Code Quality Standards (Part II, Section B)
4. **Configure language settings** -- Strict mode, appropriate compiler options
5. **Configure environment variable validation** -- Set up schema-based validation (e.g., Zod) so the app fails fast at startup if required env vars are missing. Import the validated env object instead of reading raw env vars directly
6. **Set up testing** -- Install test framework, create initial configuration, create initial security test suite
7. **Create governance files:**
   - `CLAUDE.md` -- Project instructions, tech stack (marked LOCKED), standards, prohibited patterns, session protocol
   - `HANDOFF.md` -- Session continuity tracker. Contains: what's done, what's in-progress, what's next, blockers, and decisions made. Updated at the end of every session. This is how the AI picks up where it left off
   - `AUDIT.md` -- Standalone audit file. Contains: the Health Dashboard scores, Issues Tracker (open/fixed/deferred), Tech Debt Register, Security Posture checklist, Accessibility Status, and Audit History log. This is the living record of project quality. Updated whenever issues are found or fixed
   - `ProjectHealth.md` -- High-level project health summary. Contains: overall grade, dimension scores, codebase metrics, open issue count, and a production readiness checklist. This is the quick-glance view of where the project stands and what must be resolved before the project is production-ready
   - `.env.example` -- Environment variable template (names only, no values)
   - `.gitignore` -- Appropriate ignores for the chosen stack
   - Copy this file (`BuiltByBasProjectSetup.md`) into the project's `.claude/` directory as the standards reference
8. **Apply security basics** -- Headers, input validation patterns, secrets management per Section A
9. **Run initial quality gates** -- Lint, type-check, build, test -- all must pass
10. **Run a full initial audit** -- Score every applicable dimension, populate `AUDIT.md` and `ProjectHealth.md` with initial scores
11. **Patch any issues found** -- Fix anything from the initial audit, update `AUDIT.md` with resolutions
12. **Commit standards to AI memory** -- Write the Eight Pillars, conflict resolution hierarchy, prohibited actions, session protocol, and key standards from Part II into the AI's persistent project memory files (e.g., `~/.claude/projects/[project]/memory/`). This ensures the AI carries these standards across sessions even if this file is not re-read. At minimum, the memory should contain:
    - The Eight Pillars and their core questions
    - The conflict resolution hierarchy
    - The full prohibited actions list
    - The session protocol (start/during/end)
    - The tech stack lock status
    - The fallback priority chain
    - The governance file locations and their purposes

---

## Step 6: Infrastructure Foundation

After the codebase is scaffolded (Step 5), set up the foundational infrastructure. These guides are reusable across projects and must be completed before feature development begins. Each section follows the Eight Pillars.

> **Note:** Steps 6a-6d run in local dev. VPS deployment (Step 6c NGINX) happens later when the site is ready to show the client. Complete 6a, 6b, and 6d locally first.

---

### Step 6a: GitHub Setup

> Pillar alignment: Structure (backup + collaboration), Security (access control), R3S (recovery from any failure)

GitHub is the single source of truth for code and the primary backup/recovery mechanism.

**Initial repository setup:**

```bash
# Initialize git (if not already done by framework scaffold)
git init

# Create .gitignore (framework-specific -- never commit secrets, deps, or build output)
# Verify these are present:
#   .env, .env.local, .env.*.local
#   node_modules/, .next/, /build, /out
#   /coverage, /test-results, /playwright-report
#   *.pem, .DS_Store, Thumbs.db

# Initial commit
git add .
git commit -m "chore: initial project scaffold

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Create GitHub repository:**

```bash
# Create private repo (default -- public only for open-source)
gh repo create [org-or-user]/[project-name] --private --source=. --push

# Verify remote
git remote -v
```

**Branch protection (configure via GitHub UI or CLI):**

| Setting                   | Value                               |
| ------------------------- | ----------------------------------- |
| Default branch            | `main`                              |
| Require PR for merge      | Recommended for team projects       |
| Require status checks     | Enable once CI is configured        |
| Force push protection     | Enabled -- never force-push to main |
| Delete branch after merge | Enabled                             |

**Backup strategy:**

- Every commit to `main` is automatically backed up on GitHub
- Local + remote = 2 copies minimum at all times
- For VPS: the deployed server is a 3rd copy (`git pull` on deploy)
- Catastrophic recovery: clone from GitHub, restore `.env`, push schema, seed DB

**Commit conventions (enforced every session):**

```
Format: <type>: <description>
Types:  feat, fix, docs, style, refactor, test, build, chore
Footer: Co-Authored-By: Claude <noreply@anthropic.com>
```

**GitHub Actions CI (add when ready):**

Create `.github/workflows/ci.yml` to run quality gates on every push:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm test
      - run: pnpm build
```

---

### Step 6b: PostgreSQL / Database Setup

> Pillar alignment: Security (isolated user, strong password), Structure (schema-first), R3S (backup + recovery), Performance (indexed queries)

PostgreSQL is the default database for all web applications. Self-hosted on the same machine during development, self-hosted on VPS in production.

**Prerequisites:**

- PostgreSQL installed (v15+ recommended, v17 preferred)
- `psql` accessible from terminal
- Prisma (or chosen ORM) in the project

**Create database and user:**

```sql
-- Connect as postgres superuser
-- Windows: use pgAdmin or psql from PostgreSQL bin directory
-- Linux/Mac: sudo -u postgres psql

-- Create a dedicated user (NEVER use the postgres superuser for the app)
CREATE USER [project]_user WITH PASSWORD '[strong-random-password]';

-- Create the database owned by that user
CREATE DATABASE [project] OWNER [project]_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE [project] TO [project]_user;

-- Verify
\l    -- list databases
\du   -- list users
```

**Security rules:**

| Rule                               | Standard                                           |
| ---------------------------------- | -------------------------------------------------- |
| **Dedicated user per project**     | Never share DB users across projects               |
| **Strong password**                | 20+ characters, random, stored only in `.env`      |
| **No superuser for apps**          | App user has access to its own database only       |
| **Connection string in .env only** | Never hardcode, never commit                       |
| **Local connections only (dev)**   | PostgreSQL listens on localhost during development |
| **SSL required (production)**      | Enable SSL for DB connections on VPS               |

**Configure the connection:**

```bash
# .env (never committed)
DATABASE_URL=postgresql://[project]_user:[password]@localhost:5432/[project]

# .env.example (committed -- names only, no real values)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**Schema management with Prisma:**

```bash
# Define your schema in prisma/schema.prisma
# datasource block:
#   provider = "postgresql"
#   url      = env("DATABASE_URL")

# Push schema to database (development)
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Create seed file (prisma/seed.ts)
# Seeds must be IDEMPOTENT -- safe to re-run using upserts
pnpm db:seed

# For production migrations (when schema is stable)
pnpm db:migrate
```

**Recommended package.json scripts:**

```json
"db:generate": "prisma generate",
"db:push": "prisma db push",
"db:migrate": "prisma migrate dev",
"db:studio": "prisma studio",
"db:seed": "prisma db seed"
```

**Seed data rules:**

- Seeds must be **idempotent** (use `upsert` or `deleteMany` + `create`)
- Include realistic sample data for development
- Hash all passwords (bcrypt 12+ rounds) -- never store plaintext even in seed
- Include all user roles for testing auth flows

**Backup strategy (production):**

```bash
# Daily automated backup (add to crontab on VPS)
pg_dump -U [project]_user -h localhost [project] | gzip > /backups/[project]-$(date +%Y%m%d).sql.gz

# Keep 30 days of backups
find /backups -name "[project]-*.sql.gz" -mtime +30 -delete

# Restore from backup
gunzip -c /backups/[project]-20260309.sql.gz | psql -U [project]_user -h localhost [project]
```

**Verification checklist:**

- [ ] Dedicated database created
- [ ] Dedicated user created (not superuser)
- [ ] `.env` has correct `DATABASE_URL`
- [ ] `.env.example` has placeholder `DATABASE_URL`
- [ ] `prisma db push` succeeds
- [ ] `prisma db seed` succeeds and is idempotent
- [ ] `prisma studio` opens and shows tables
- [ ] Application connects and queries work

---

### Step 6c: NGINX Setup (VPS Phase)

> Pillar alignment: Security (SSL, headers, rate limiting), Performance (caching, compression), R3S (auto-restart, recovery)

NGINX is the reverse proxy between the internet and the application. This step happens when deploying to VPS -- not during local development.

**Prerequisites:**

- Ubuntu VPS with SSH access (key-based, non-root user)
- Domain pointing to VPS IP (A record)
- Node.js + pnpm installed on VPS
- Application cloned and built on VPS

**Install NGINX:**

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx   # Start on boot
sudo systemctl start nginx
```

**Create site configuration:**

```nginx
# /etc/nginx/sites-available/[project]
server {
    listen 80;
    server_name [domain] www.[domain];

    # Redirect HTTP to HTTPS (after SSL is configured)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name [domain] www.[domain];

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/[domain]/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/[domain]/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Hide NGINX version
    server_tokens off;

    # Security headers (defense in depth -- app also sets these)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;
    gzip_min_length 1000;

    # Reverse proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static asset caching (Next.js _next/static is immutable)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public assets caching
    location /images/ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

**Enable site and test:**

```bash
# Symlink to sites-enabled
sudo ln -s /etc/nginx/sites-available/[project] /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

**SSL with Let's Encrypt:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (auto-configures NGINX)
sudo certbot --nginx -d [domain] -d www.[domain]

# Verify auto-renewal
sudo certbot renew --dry-run

# Certbot auto-renews via systemd timer -- verify it exists
sudo systemctl list-timers | grep certbot
```

**Process manager (PM2) -- keeps the app running:**

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
cd /var/www/[project]
pm2 start npm --name "[project]" -- start

# Save process list (survives reboot)
pm2 save

# Enable PM2 startup on boot
pm2 startup systemd
# Run the command it outputs

# Useful commands
pm2 status          # Check all processes
pm2 logs [project]  # View logs
pm2 restart [project]
pm2 monit           # Live monitoring
```

**Deploy command (after initial setup):**

```bash
cd /var/www/[project] && git pull origin main && pnpm install --frozen-lockfile && pnpm build && pm2 restart [project]
```

**Firewall (UFW):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh        # Or custom SSH port
sudo ufw allow 80/tcp     # HTTP (for redirect)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

**Fail2ban (intrusion prevention):**

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# Edit: set bantime=3600, findtime=600, maxretry=5
sudo systemctl restart fail2ban
```

**What happens on restart (the full chain):**

```
Server boots
  → systemd starts PostgreSQL (automatic)
  → systemd starts NGINX (automatic)
  → systemd starts PM2 via startup script
    → PM2 starts the Next.js app on port 3000
  → NGINX proxies port 443 → port 3000
  → Site is live. No manual intervention needed.
```

**NGINX verification checklist:**

- [ ] NGINX installed and enabled on boot
- [ ] Site config created and symlinked
- [ ] `nginx -t` passes
- [ ] SSL certificate installed and auto-renewing
- [ ] HTTP redirects to HTTPS
- [ ] PM2 running the app, saved, and set for startup
- [ ] Firewall allows only SSH, 80, 443
- [ ] Fail2ban active
- [ ] Full reboot test: server restarts and site comes back automatically
- [ ] Version header hidden (`server_tokens off`)

---

### Step 6d: SEO Foundation

> Pillar alignment: Performance (fast discovery), Structure (organized metadata), UX (findability), Security (controlled crawl scope)

SEO is not an afterthought -- it is foundational infrastructure. Set up the skeleton at project start so every page ships with proper metadata from day one.

**Centralized SEO config (`src/lib/seo.ts` or equivalent):**

Create a single source of truth for all SEO data:

```typescript
// All business/site data in one place
export const SITE_URL = "https://[domain]";

export const BUSINESS = {
  name: "[Business Name]",
  description: "[Primary description for meta tags]",
  phone: "+1-XXX-XXX-XXXX",
  email: "[email]",
  address: { street, city, state, zip, country },
  geo: { latitude, longitude },
  hours: [{ days, open, close }],
  social: { instagram, facebook, ... },
  rating: { value, count },  // If applicable
  priceRange: "$$",
  founded: "[year]",
  areaServed: ["[area1]", "[area2]", ...],
};

export const SEO_KEYWORDS = {
  primary: [...],    // Brand + core terms
  services: [...],   // Service-specific long-tail
  local: [...],      // Location-based terms
};
```

**Required SEO files (create during setup):**

| File / Route                    | Purpose                              | Priority |
| ------------------------------- | ------------------------------------ | -------- |
| `src/lib/seo.ts`                | Centralized business + keyword data  | Setup    |
| `src/app/layout.tsx`            | Root metadata, OG, Twitter, manifest | Setup    |
| `src/app/sitemap.ts`            | Dynamic XML sitemap                  | Setup    |
| `src/app/robots.ts`             | Crawl directives                     | Setup    |
| `src/components/seo/JsonLd.tsx` | JSON-LD structured data components   | Setup    |
| `public/manifest.webmanifest`   | PWA manifest with branding           | Setup    |
| `public/llms.txt`               | AI engine summary (concise)          | Setup    |
| `public/llms-full.txt`          | AI engine full reference             | Setup    |
| `src/lib/faq.ts`                | Shared FAQ data for JSON-LD + pages  | Setup    |

**Root layout metadata (minimum):**

Every project must set these in the root `layout.tsx`:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "[Business] | [Primary Keyword]",
    template: "%s | [Business]",
  },
  description: "[keyword-rich description, 150-160 chars]",
  keywords: getAllKeywords(),
  authors: [{ name: BUSINESS.name }],
  creator: BUSINESS.name,
  publisher: BUSINESS.name,
  formatDetection: { telephone: true, email: true, address: true },
  alternates: { canonical: SITE_URL },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: BUSINESS.name,
    title: "[title]",
    description: "[description]",
    images: [{ url: "/images/og-image.webp", width: 1200, height: 630, alt: "[description]" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "[title]",
    description: "[description]",
    images: ["/images/og-image.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

**Per-page metadata rules:**

| Page Type         | Metadata Approach                                                    |
| ----------------- | -------------------------------------------------------------------- |
| Server components | Export `metadata` or `generateMetadata` directly from page.tsx       |
| Client components | Create a `layout.tsx` in the route folder to export metadata         |
| Dynamic routes    | Use `generateMetadata` with DB lookup for unique titles/descriptions |
| Private pages     | Set `robots: { index: false, follow: false }`                        |

**JSON-LD structured data (Schema.org):**

Create reusable components for each schema type needed:

| Schema Type       | When to Use                     |
| ----------------- | ------------------------------- |
| `LocalBusiness`   | Homepage / root layout          |
| `WebSite`         | Root layout (enables sitelinks) |
| `Service`         | Services page                   |
| `Person`          | Team/staff profile pages        |
| `FAQPage`         | Any page with FAQ content       |
| `BreadcrumbList`  | All pages except homepage       |
| `Product`         | Product/shop pages              |
| `AggregateRating` | Nested in LocalBusiness         |

**Sitemap (`src/app/sitemap.ts`):**

```typescript
// Dynamic sitemap that queries DB for dynamic pages
// Static pages: define manually with priority
// Dynamic pages: query DB and map to URLs
// Priority scale: homepage 1.0, key pages 0.9, secondary 0.7-0.8, low 0.5
```

**Robots (`src/app/robots.ts`):**

```typescript
// Allow: /
// Disallow: /api/, /login, /dashboard/, any private routes
// Include sitemap URL
```

**AI Engine Optimization (llms.txt):**

```
// public/llms.txt -- concise summary (under 50 lines)
// Business name, location, hours, services, team, highlights, contact, FAQ link

// public/llms-full.txt -- comprehensive reference
// Full service descriptions, team bios, FAQ with answers, areas served, reviews
```

**FAQ data (`src/lib/faq.ts`):**

```typescript
// Shared array of { question, answer } objects
// Used for: JSON-LD FAQPage schema, AI engine answers, potential FAQ page
// Keep answers concise and keyword-rich
```

**OG image requirements:**

- Minimum 1200x630px
- WebP format preferred
- Include business branding
- Descriptive alt text
- Place in `public/images/`

**SEO verification checklist:**

- [ ] `metadataBase` set to production URL
- [ ] Root layout has title template, description, keywords, OG, Twitter
- [ ] Every public page has unique title and description
- [ ] `sitemap.ts` generates valid XML with all public pages
- [ ] `robots.ts` blocks private routes, includes sitemap URL
- [ ] JSON-LD on homepage (LocalBusiness + WebSite + FAQ)
- [ ] JSON-LD on service pages (Service schema)
- [ ] JSON-LD on team/profile pages (Person schema)
- [ ] Breadcrumb JSON-LD on all pages except homepage
- [ ] `manifest.webmanifest` with correct name, colors, icons
- [ ] `llms.txt` and `llms-full.txt` in public directory
- [ ] FAQ data centralized and used in JSON-LD
- [ ] OG image exists and is referenced
- [ ] Private pages (login, dashboard, intake) set to `noindex`
- [ ] Canonical URLs set on all pages
- [ ] No duplicate titles or descriptions across pages

---

## Step 7: Project Ready

Once setup is complete (Steps 5 + 6), display:

```
=============================================
      BuiltByBas Project Health
      Setup Complete
=============================================

CODEBASE
  All dependencies installed.
  Linting & formatting configured.
  Testing framework ready.
  Security basics applied.
  Environment validation configured.
  Initial audit: PASS

INFRASTRUCTURE
  GitHub:     Repo created, remote set
  PostgreSQL: Database + user created, schema pushed, seed run
  SEO:        Metadata, sitemap, robots, JSON-LD, llms.txt ready
  NGINX:      Deferred to VPS phase

GOVERNANCE
  CLAUDE.md        -- Project instructions
  HANDOFF.md       -- Session continuity
  AUDIT.md         -- Quality & issues
  ProjectHealth.md -- Health summary
  .env.example     -- Env var template

Standards committed to AI memory.
Tech stack is LOCKED.
Your project is ready to build.
=============================================
```

Then provide **3-5 suggestions** for where the project should start, prioritized by impact:

1. The most foundational piece (data model, core layout, API structure)
2. The next logical building block
3. A quick win that delivers visible progress

Ask the user which one they'd like to start with, or if they have something else in mind.

---

---

# PART II: The Dev Studio Bible -- Standards & Best Practices

These standards govern every project. They are not suggestions -- they are the rules. The AI must follow these when writing code, reviewing code, and auditing projects. Every standard exists because it prevented a real problem in a real project.

---

## The Eight Pillars

Every decision is governed by these eight pillars. They are non-negotiable.

| #   | Pillar                                               | Core Question                                                     |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | **Security Minded**                                  | Can this be exploited?                                            |
| 2   | **Structure**                                        | Can someone else pick this up tomorrow?                           |
| 3   | **Performance**                                      | Does this respect the user's time and device?                     |
| 4   | **Inclusive**                                        | Can everyone use this?                                            |
| 5   | **Non-Bias**                                         | Does this assume or exclude?                                      |
| 6   | **UX Minded**                                        | Does this feel intentional and clear?                             |
| 7   | **Universal Design (UD/UDL)**                        | Does this work for the widest range of people without adaptation? |
| 8   | **Robustness, Redundancy, Recovery, Strategy (R3S)** | What happens when something fails?                                |

### Conflict Resolution Hierarchy

When pillars conflict, resolve in this order:

- **Security > Performance > Convenience**
- **Accessibility > Aesthetics**
- **Data Privacy > Feature Completeness**

### Team Dynamic

- **Technical Lead (the user):** Vision, decisions, business context, final approval
- **Builder (AI):** Architecture, code, testing, documentation, quality enforcement
- **Standard:** AI recommends, user decides. Every decision is collaborative. AI executes the user's vision, does not take credit for their ideas

---

## A. Security Standards

### A.1 Input Validation

| Rule                           | Requirement                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| **Validate at boundaries**     | Every API route, form handler, and server action validates input before processing |
| **Whitelist, never blacklist** | Define what IS allowed, not what isn't                                             |
| **Server-side always**         | Client-side validation is UX; server-side is security. Both required               |
| **Type coercion**              | Explicitly cast inputs -- never assume type                                        |

**Field Whitelisting Pattern (all update operations):**

1. Define an `ALLOWED_FIELDS` constant
2. Loop through allowed fields only
3. Check if field exists in request body
4. Cast to expected type
5. Build update object from allowed fields only
6. NEVER pass raw request body to the database

**Validation checklist for every form/endpoint:**

- Required fields enforced
- String length limits (min and max)
- Enum values validated against allowed list
- Email format validated
- Number ranges validated
- File types restricted (if upload)
- File size limited (if upload)
- JSON structure validated (if nested objects)

### A.2 Injection Prevention

| Attack Vector           | Prevention                                                          |
| ----------------------- | ------------------------------------------------------------------- |
| **SQL Injection**       | Parameterized queries only. Never string-concatenate SQL            |
| **XSS**                 | Never inject user-supplied data as raw HTML. Use framework escaping |
| **Command Injection**   | Never pass user input to shell commands                             |
| **Mass Assignment**     | Field allowlists on all update routes                               |
| **Prototype Pollution** | Validate object keys against allowlist                              |

### A.3 Authentication & Sessions

| Control              | Standard                                                                    |
| -------------------- | --------------------------------------------------------------------------- |
| **Token storage**    | httpOnly cookies only -- never localStorage, never sessionStorage           |
| **Token flags**      | httpOnly, Secure (HTTPS), SameSite=Strict or Lax -- all three in production |
| **Session expiry**   | Maximum 7 days, shorter for sensitive admin panels                          |
| **Password hashing** | bcrypt or argon2 preferred, SHA-256 minimum. Never store plaintext          |
| **Rate limiting**    | 5 login attempts per 15 minutes per IP. Clear on successful login           |
| **Auth check**       | Every protected route verifies authentication server-side. No exceptions    |

### A.4 CSRF Protection

| Control               | Standard                                                                           |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Origin validation** | Validate `Origin` header on all state-changing requests (POST, PATCH, PUT, DELETE) |
| **Same-origin check** | Compare origin against known host -- reject mismatches                             |
| **Read-only exempt**  | GET requests do not require origin check                                           |

### A.5 File Upload Security

| Control             | Standard                                                                                |
| ------------------- | --------------------------------------------------------------------------------------- |
| **Allowed types**   | Explicit whitelist (e.g., JPEG, PNG, WebP, GIF, AVIF)                                   |
| **Max size**        | 5 MB default -- adjust per project                                                      |
| **Filename**        | Generate server-side (`{timestamp}-{random}.{ext}`) -- never use user-supplied filename |
| **MIME validation** | Check MIME type server-side, not just file extension                                    |
| **Storage**         | Remote storage preferred -- never local filesystem in production                        |

### A.6 Security Headers

Required on every project with a web interface:

| Header                      | Value                                             | Purpose                   |
| --------------------------- | ------------------------------------------------- | ------------------------- |
| `X-Frame-Options`           | `DENY`                                            | Prevent clickjacking      |
| `X-Content-Type-Options`    | `nosniff`                                         | Prevent MIME sniffing     |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                 | Limit referrer leakage    |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`        | Disable unused APIs       |
| `Content-Security-Policy`   | Project-specific, start with `default-src 'none'` | Prevent XSS and injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`             | Force HTTPS (production)  |

**CSP Tiers:**

| Tier               | When to Use                                          | Baseline                                                                                         |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **A+ (Strictest)** | Static sites, no external deps                       | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'` |
| **A (Strict)**     | Dynamic sites with known external services           | `default-src 'self'` + explicit allowlists per service                                           |
| **B (Standard)**   | Sites requiring inline styles (framework constraint) | Add `'unsafe-inline'` to `style-src` only -- never to `script-src`                               |

**CSP rules:**

- Start with `default-src 'none'` and add only what's needed
- Never use `'unsafe-eval'` in production
- Prefer nonce-based script loading over `'unsafe-inline'`
- Document every external domain added with a reason
- Always include `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`

### A.7 Secrets Management

| Rule                     | Standard                                                      |
| ------------------------ | ------------------------------------------------------------- |
| **Never commit secrets** | `.env`, `.env.local`, credential files always in `.gitignore` |
| **Server-only keys**     | Database/API secret keys never exposed to client bundles      |
| **`.env.example`**       | Every project has one -- variable names only, no values       |
| **Git history**          | Audit for accidentally committed secrets before going public  |
| **Key rotation**         | Document how to rotate each secret                            |

**Environment Variable Validation:**

- Define a schema (e.g., Zod) for all required environment variables
- Validate at application startup -- fail fast if any are missing or malformed
- Import the validated env object throughout the codebase instead of reading raw env vars directly
- This prevents runtime crashes from missing configuration

### A.8 Error Handling (Security)

| Rule                             | Standard                                                 |
| -------------------------------- | -------------------------------------------------------- |
| **Never expose stack traces**    | Generic message to client, full error logged server-side |
| **Never expose database errors** | "Something went wrong" -- not the raw DB error           |
| **Never log PII**                | No names, emails, phone numbers, ages in logs            |
| **Error boundaries**             | Every public-facing app has root-level error recovery    |
| **Graceful degradation**         | External service failure shows fallback -- never a crash |

### A.9 Data Privacy

| Rule                       | Standard                                                                  |
| -------------------------- | ------------------------------------------------------------------------- |
| **PII encryption at rest** | AES-256-GCM or equivalent for stored PII                                  |
| **Soft deletes**           | Use `deleted_at` timestamp -- never hard delete without explicit request  |
| **Minimal collection**     | Only collect data you actively use                                        |
| **PII inventory**          | Know exactly what PII your project stores and where                       |
| **Data export**            | Users can request their data in a portable format                         |
| **COPPA**                  | If minors may use the app: age-gating, parental consent, zero PII logging |
| **CCPA**                   | If serving California: privacy policy, deletion capability, disclosure    |

### A.10 Dependency Security

| Rule                       | Standard                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| **Audit before adding**    | Check downloads, maintenance status, known vulnerabilities          |
| **Run dependency audit**   | Before every deployment -- 0 critical vulnerabilities in production |
| **Pin major versions**     | Prevent unexpected breaking changes                                 |
| **Prefer fewer deps**      | Every dependency is an attack surface                               |
| **Review transitive deps** | A package's dependencies are your dependencies                      |

### A.11 Infrastructure Security (applies at deployment time)

| Layer               | Standard                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| **SSH**             | Key-based auth (Ed25519), password auth disabled, non-standard port (e.g., 2222) |
| **Firewall**        | Default deny inbound, allow only 80, 443, SSH port                               |
| **IPS**             | Fail2ban or equivalent (5 retries, 1-hour ban)                                   |
| **Root login**      | Disabled -- use a named user account                                             |
| **SSL/TLS**         | Auto-renewal (Let's Encrypt), TLS 1.2+ only                                      |
| **Process manager** | Auto-restart on crash and boot (PM2 or equivalent)                               |
| **Nginx**           | Version hidden, HTTP-to-HTTPS redirect                                           |

**VPS Deploy Command Template:**

```
cd /var/www/[project] && git pull origin main && [pkg-mgr] install --frozen-lockfile && [pkg-mgr] build && [process-mgr] restart [process-name]
```

---

## B. Code Quality & Structure Standards

> Every line of code must be intentional. No lazy shortcuts, no sloppy patterns, no dead weight, no hidden risks.

### B.1 Industry Best Practices (Non-Negotiable)

| Principle                   | Standard                                                         | Enforcement                                 |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| **DRY**                     | No duplicated logic -- extract shared utilities                  | Code review + search for duplicate patterns |
| **SOLID**                   | Single responsibility per function/component, open for extension | Max function length 50 lines                |
| **KISS**                    | Simplest solution that works -- no premature abstraction         | Code review                                 |
| **YAGNI**                   | Don't build for hypothetical future requirements                 | Reject speculative code                     |
| **Separation of Concerns**  | UI, business logic, data access, config in separate layers       | File organization audit                     |
| **Single Source of Truth**  | Every piece of data has ONE authoritative location               | Search for duplicate definitions            |
| **Fail Fast**               | Validate early, throw early, surface errors at the boundary      | Code review                                 |
| **Least Surprise**          | Code does what its name says -- no hidden side effects           | Naming review                               |
| **Clean Boundaries**        | External services wrapped in adapters -- never coupled directly  | Architecture review                         |
| **Immutability by Default** | Prefer `const`, avoid mutation, use spread/map over push/splice  | Lint rules                                  |

### B.2 Documentation Requirements

**Every project MUST have these files:**

| File                        | Purpose                                                                   | Update Frequency        |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------- |
| `CLAUDE.md`                 | Project instructions, tech stack (LOCKED), standards, prohibited patterns | When standards change   |
| `HANDOFF.md`                | Current state -- done, in-progress, blocked, next actions                 | Every session           |
| `BuiltByBasProjectSetup.md` | Health dashboard, issues tracker, tech debt, audit history                | When issues found/fixed |
| `.env.example`              | Environment variable template (names only, no values)                     | When env vars change    |

**Optional but recommended:**

| File                 | Purpose                                     | When Needed                |
| -------------------- | ------------------------------------------- | -------------------------- |
| `COST.md`            | Project value assessment, market rates, ROI | Client projects            |
| `VPS-CHEATSHEET.md`  | Server commands quick reference             | Self-hosted projects       |
| `RAI-POLICY.md`      | Responsible AI use policy                   | Projects using AI          |
| `SecurityPosture.md` | Detailed security audit and posture         | Security-critical projects |

### B.3 Code Organization

| Rule                              | Standard                                                  |
| --------------------------------- | --------------------------------------------------------- |
| **One component/module per file** | Named export matching filename                            |
| **No file over 500 lines**        | Split into focused modules                                |
| **No dead code**                  | Remove commented-out blocks, unused imports, legacy shims |
| **No file bloat**                 | Prefer editing existing files over creating new ones      |
| **Clear directory structure**     | Group by feature or domain, not by file type              |

### B.4 Naming Conventions

| Type                  | Convention           | Example                                     |
| --------------------- | -------------------- | ------------------------------------------- |
| Components / Classes  | PascalCase           | `WeatherCard`, `UserService`                |
| Functions / Variables | camelCase            | `formatDate`, `isValid`                     |
| Constants             | UPPER_SNAKE_CASE     | `MAX_ATTEMPTS`, `ALLOWED_TYPES`             |
| Types / Interfaces    | PascalCase           | `UserRow`, `ContactFormData`                |
| Files                 | Match primary export | Component = PascalCase, utility = camelCase |
| Directories           | kebab-case           | `api/admin/`, `components/shared/`          |

### B.5 Code Section Markers

Use consistent section markers to organize code within files:

| Language                | Section Markers                                    |
| ----------------------- | -------------------------------------------------- |
| HTML                    | `<!-- === SECTION === -->` ... `<!-- /SECTION -->` |
| CSS                     | `/* === SECTION === */` with component sub-markers |
| JavaScript / TypeScript | `// === SECTION ===` with JSDoc comments           |

### B.6 Git Standards

| Rule                     | Standard                                                                       |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Commit messages**      | `<type>: <description>` (feat, fix, docs, style, refactor, test, build, chore) |
| **Co-author**            | `Co-Authored-By: Claude <noreply@anthropic.com>` on AI-assisted commits        |
| **Never force-push**     | To any shared branch                                                           |
| **Never commit secrets** | `.env`, credentials, API keys                                                  |
| **Test before push**     | All tests pass, build succeeds                                                 |
| **Atomic commits**       | One logical change per commit                                                  |
| **Trunk-based**          | `main` is always deployable. Feature/fix branches are short-lived              |

### B.7 Documentation Standards

| Rule                  | Standard                                               |
| --------------------- | ------------------------------------------------------ |
| **Markdown tables**   | Columns aligned in source                              |
| **Heading hierarchy** | Sequential -- no skipping levels                       |
| **No raw HTML**       | In markdown files                                      |
| **Scannability**      | Use headers, short bullets, tables -- no walls of text |

### B.8 Archive Pattern

When governance documents exceed 750 lines:

1. Move completed/historical sections to an `archive/` directory
2. Retain key facts and summary inline (never lose context entirely)
3. Archived content is **append-only** -- never modify archived files
4. Reference the archive location from the main document

### B.9 Tech Stack Lock Protocol

Once the tech stack is approved during project setup:

- The stack is **LOCKED** -- no changes without formal justification
- To change any layer: document the reason in HANDOFF.md, get explicit user approval
- This prevents scope creep, dependency churn, and mid-project rewrites

### B.10 Code Review Checklist (Every Session)

| #   | Check                                                                  | Category    |
| --- | ---------------------------------------------------------------------- | ----------- |
| 1   | Does every function do ONE thing?                                      | Clean Code  |
| 2   | Are variable names descriptive and unambiguous?                        | Readability |
| 3   | Are there magic numbers or hardcoded strings that should be constants? | Readability |
| 4   | Is error handling complete? No swallowed exceptions?                   | Robustness  |
| 5   | Are all edge cases handled (null, empty, undefined)?                   | Robustness  |
| 6   | Does the code follow existing patterns in the codebase?                | Consistency |
| 7   | Are there unnecessary dependencies or imports?                         | Performance |
| 8   | Is there duplicated logic that should be extracted?                    | DRY         |
| 9   | Could this code be simpler without losing functionality?               | KISS        |
| 10  | Are types strict and specific (no unsafe bypasses)?                    | Type Safety |
| 11  | Is the code self-documenting (clear names over comments)?              | Readability |
| 12  | Are all API responses validated before use?                            | Security    |
| 13  | Are user inputs sanitized at system boundaries?                        | Security    |
| 14  | Does the code handle network failures gracefully?                      | R3S         |
| 15  | Is there a fallback if the data source fails?                          | R3S         |
| 16  | Are all user-facing strings inclusive?                                 | Inclusive   |

### B.11 Code Smell Detection Scans

Run these scans on every project. Zero tolerance for results in production code. Adapt file extensions and paths to your stack.

**Lazy code patterns:**

- Unused variables and imports
- Empty catch blocks (swallowed errors)
- TODO/FIXME/HACK/XXX/TEMP left in production code
- Console/debug statements left in production
- Commented-out code blocks (dead code)
- Magic numbers (unexplained numeric literals)

**Bad code patterns:**

- Deeply nested conditions (more than 3 levels)
- Functions longer than 50 lines
- Unsafe type annotations or unchecked casts
- Non-null assertions without runtime checks
- Type assertions without runtime verification
- Synchronous file operations in server code
- Unbounded queries (missing LIMIT/pagination)

**Untidy code patterns:**

- Tabs mixed with spaces
- Trailing whitespace
- Multiple consecutive blank lines (more than 2)
- Files exceeding 500 lines
- Inconsistent naming conventions within same file

**Malicious/suspicious code patterns:**

- `eval()`, `new Function()`, dynamic code execution
- Base64-encoded strings (`atob`, `btoa`)
- External fetch calls to unknown domains
- Backdoor keywords (`bypass`, `override auth`, `skip auth`, `master key`)
- Injected script tags, `document.write`, `.innerHTML` assignment
- Unauthorized environment variable access in client bundles
- WebSocket connections or `navigator.sendBeacon` to unknown endpoints

The AI should generate stack-appropriate grep/search commands for these during project setup and document them in the project's CLAUDE.md.

### B.12 Prohibited Actions (Every Project)

- **Never force-push** to any shared branch
- **Never commit** `.env` or any file containing secrets
- **Never inject user-supplied data** as raw HTML
- **Never use unsafe type bypasses** (e.g., `any` in TypeScript, untyped casts)
- **Never pass raw request body** to database update operations
- **Never store tokens in client-accessible storage** -- httpOnly cookies only
- **Never expose service/secret keys** to client bundles
- **Never skip auth checks** on protected routes
- **Never delete user data** without explicit confirmation
- **Never log PII** (names, emails, phone numbers, ages)
- **Never ship without passing quality gates**
- **Never use dynamic code execution** with any input (`eval`, `exec`, `new Function`)
- **Never skip hooks or bypass safety checks** (e.g., `--no-verify`)
- **Never use `@ts-ignore` or disable linting** without a documented justification comment
- **Never modify archived content** in `archive/` directories

---

## C. Performance Standards

### C.1 Core Web Vitals Targets

| Metric                          | Target  | What It Measures              |
| ------------------------------- | ------- | ----------------------------- |
| LCP (Largest Contentful Paint)  | < 2.5s  | How fast main content loads   |
| FCP (First Contentful Paint)    | < 1.8s  | How fast anything appears     |
| CLS (Cumulative Layout Shift)   | < 0.1   | How much the page jumps       |
| INP (Interaction to Next Paint) | < 200ms | How fast interactions respond |
| Lighthouse Performance          | 90+     | Overall performance score     |
| Lighthouse Accessibility        | 100     | Accessibility compliance      |
| Lighthouse SEO                  | 90+     | Search engine optimization    |

### C.2 Image Optimization

| Rule                          | Standard                                                                  |
| ----------------------------- | ------------------------------------------------------------------------- |
| **Framework image component** | Always use the framework's optimized image component -- never raw `<img>` |
| **Responsive sizes**          | Every image has a `sizes` attribute matching its rendered size            |
| **Priority loading**          | Hero/above-fold images load eagerly                                       |
| **Format**                    | WebP preferred for uploads                                                |
| **Dimensions**                | Maximum 2400px wide                                                       |
| **Alt text**                  | Descriptive for informational, empty for decorative                       |

### C.3 Font Optimization

| Rule             | Standard                                                     |
| ---------------- | ------------------------------------------------------------ |
| **Loading**      | Self-hosted or framework-managed -- never external CDN links |
| **Families**     | Maximum 2 per project                                        |
| **Subsetting**   | Latin only unless i18n requires more                         |
| **Layout shift** | Zero -- use font-display swap or equivalent                  |

### C.4 Data Fetching

| Rule                 | Standard                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| **Server-first**     | Fetch on server when possible -- minimize client-side fetches for initial data |
| **Specific columns** | Select only the columns you need -- never SELECT \*                            |
| **Pagination**       | Paginate queries returning potentially large result sets                       |
| **Caching**          | Use appropriate caching strategy + on-demand revalidation                      |
| **Static fallbacks** | Site works even if database is down -- use fallback data                       |
| **Lazy loading**     | Defer heavy components below the fold                                          |
| **No N+1 queries**   | Use joins or batch fetching -- never query in a loop                           |

### C.5 Bundle Optimization

| Rule                | Standard                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **No bloat**        | Don't add packages without clear justification. No packages over 50KB gzipped without documented reason |
| **Tree shaking**    | Named imports, never `import *`                                                                         |
| **Dynamic imports** | Heavy components (maps, charts) loaded lazily with loading skeletons                                    |
| **Bundle analysis** | Monitor size -- alert on changes that increase bundle by more than 10KB                                 |

---

## D. Accessibility Standards (WCAG 2.1 AA)

Every project with a user-facing interface must meet these requirements:

| Requirement                  | Standard                                                                | How to Test      |
| ---------------------------- | ----------------------------------------------------------------------- | ---------------- |
| **Skip-to-content link**     | First focusable element on every page                                   | Manual + E2E     |
| **All images have alt text** | Descriptive for informational, empty for decorative                     | Automated scan   |
| **Color contrast 4.5:1**     | All text meets minimum contrast ratio                                   | Lighthouse + axe |
| **Keyboard accessible**      | All interactive elements reachable via Tab, activatable via Enter/Space | Manual + E2E     |
| **Visible focus indicators** | Never remove outline without a replacement                              | Visual review    |
| **Semantic HTML**            | `<button>` for actions, `<a>` for navigation, proper landmarks          | Automated scan   |
| **Touch targets 44x44px**    | All buttons and links meet minimum size on mobile                       | Manual review    |
| **Reduced motion**           | Disable/reduce animations when user prefers                             | CSS media query  |
| **Heading hierarchy**        | No skipped levels (h1 then h2 then h3)                                  | Automated scan   |
| **Form labels**              | Every input has a label linked via `for`/`id` or wrapping               | Automated scan   |
| **Error messages**           | Linked to inputs via ARIA, announced to screen readers                  | Manual + axe     |
| **Language attribute**       | Set on root HTML element                                                | Automated scan   |
| **200% zoom**                | No horizontal scrolling required at 200% text size                      | Manual review    |
| **ARIA attributes**          | Custom widgets use proper roles and states. ARIA only as last resort    | Manual review    |

---

## E. Inclusivity, Bias & Language Standards

### E.1 Inclusive Language

| Rule                          | Standard                                                         |
| ----------------------------- | ---------------------------------------------------------------- |
| **Gender-neutral by default** | Use "they/them" when gender unknown                              |
| **No binary assumptions**     | No Male/Female-only options. Use "Parent/Guardian" not "Mom/Dad" |
| **Safe space**                | Tone never alienates, mocks, or others anyone                    |
| **Inclusive examples**        | Represent diverse identities and family structures               |

### E.2 Ability-Inclusive Language

| Avoid                                       | Use Instead                                             |
| ------------------------------------------- | ------------------------------------------------------- |
| Language assuming walking/physical mobility | Neutral alternatives (e.g., "explorations" not "walks") |
| "Walk you through"                          | "Guide you through"                                     |
| "Takes physical effort"                     | "Bring energy and dedication"                           |
| Any language assuming physical capability   | Neutral language that includes all abilities            |

### E.3 Neurodivergent-Friendly Design

| Rule                       | Standard                                              |
| -------------------------- | ----------------------------------------------------- |
| **Scannability**           | Use headers, bullets, tables -- no walls of text      |
| **Clear hierarchy**        | Most important information first                      |
| **Capacity-aware**         | Designed for real life, not ideal conditions          |
| **No time pressure**       | Avoid countdown timers, auto-dismissing notifications |
| **Clear error messages**   | What went wrong + how to fix it                       |
| **Progressive disclosure** | Show what's needed now, reveal complexity as needed   |

### E.4 Non-Bias

| Rule                           | Standard                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Diverse examples**           | Names and identities reflect real-world diversity                                                                                           |
| **No demographic assumptions** | Don't assume race, ethnicity, ability, orientation                                                                                          |
| **Challenge AI bias**          | Review AI-generated content for stereotypes before use                                                                                      |
| **No "default" user**          | Design for the full range of people who will visit                                                                                          |
| **Verify AI output**           | Never deliver AI-generated content without human review                                                                                     |
| **Bias-free algorithms**       | If scoring/ranking: exclude protected characteristics. Test that identical inputs with different demographic data produce identical outputs |

### E.5 Content Tone Rules

| Rule                               | Standard                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| **No em-dashes in public content** | AI-stereotypical em-dashes (--) are banned from all user-facing content as a quality signal      |
| **Lift-up messaging only**         | No competitor bashing. Use aspirational, empowering language                                     |
| **Clarity over cleverness**        | Use "clarity," "simple system," "sustainable." Avoid hustle culture, corporate jargon, buzzwords |
| **AI works behind the scenes**     | Never lead with "AI" in client-facing language. AI is an amplifier, not a selling point          |

---

## F. Universal Design (UD/UDL)

> Universal Design means designing products that work for the widest range of people from the start -- not retrofitting accommodations as an afterthought.

### F.1 The Seven Principles

| #   | Principle                   | Application                                                                 |
| --- | --------------------------- | --------------------------------------------------------------------------- |
| 1   | **Equitable Use**           | Same features for all users, avoid segregating or stigmatizing              |
| 2   | **Flexibility in Use**      | Multiple input methods (keyboard, mouse, touch, voice), adjustable settings |
| 3   | **Simple and Intuitive**    | Clear labels, consistent navigation, no jargon                              |
| 4   | **Perceptible Information** | Multiple modalities (visual + text), sufficient contrast, alt text          |
| 5   | **Tolerance for Error**     | Undo/redo, confirmation on destructive actions, forgiving input parsing     |
| 6   | **Low Physical Effort**     | Minimal scrolling for key actions, large touch targets, keyboard shortcuts  |
| 7   | **Size and Space**          | Responsive layouts, touch targets 44x44px+, no precision-dependent UI       |

### F.2 UDL -- Multiple Means

| Category                | Rules                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| **Engagement**          | Multiple entry points to same goal. Choice in interaction (click/keyboard/tap). No auto-advancing content |
| **Representation**      | Text alternatives for all non-text content. Define domain-specific terms. Information via 2+ channels     |
| **Action & Expression** | Support keyboard, mouse, touch, assistive tech. Graduated complexity. Flexible input formats              |

### F.3 UD/UDL Checklist

| #   | Check                                                                      |
| --- | -------------------------------------------------------------------------- |
| 1   | Can a keyboard-only user complete every task?                              |
| 2   | Can a screen reader user navigate and understand all content?              |
| 3   | Does the design work at 200% zoom without horizontal scrolling?            |
| 4   | Are there multiple ways to find content (nav, search, links)?              |
| 5   | Is information conveyed through multiple channels (not color alone)?       |
| 6   | Can users control animations, auto-play, and time-based content?           |
| 7   | Are error messages clear, specific, and recovery-oriented?                 |
| 8   | Do forms accept flexible input formats?                                    |
| 9   | Is reading level appropriate for the audience?                             |
| 10  | Are touch targets 44x44px minimum with adequate spacing?                   |
| 11  | Does the layout adapt gracefully from 320px to 2560px?                     |
| 12  | Can users complete core tasks without creating an account (if applicable)? |

---

## G. UX Standards

### G.1 Feedback & Recovery

| Rule                             | Standard                                                     |
| -------------------------------- | ------------------------------------------------------------ |
| **Every action gets feedback**   | Loading state, success state, error state                    |
| **Errors are recoverable**       | Clear instructions, never dead ends                          |
| **Delete requires confirmation** | Two-step: "Delete?" then "Confirm" + loading while in-flight |
| **Optimistic updates**           | Show change immediately, rollback on failure                 |
| **Dismissible errors**           | Error banners have close buttons                             |

### G.2 Mobile First

| Rule                        | Standard                                     |
| --------------------------- | -------------------------------------------- |
| **Design for mobile first** | Enhance for larger screens                   |
| **Touch-friendly**          | 44x44px minimum touch targets                |
| **Safe areas**              | Respect safe area insets for notched devices |
| **Viewport**                | Use dynamic viewport units on mobile         |

### G.3 Consistency

| Rule                           | Standard                                             |
| ------------------------------ | ---------------------------------------------------- |
| **Same action, same behavior** | Buttons, links, forms work identically everywhere    |
| **Consistent terminology**     | Pick one word and use it everywhere                  |
| **Consistent spacing**         | Follow a spacing scale (4, 8, 12, 16, 24, 32, 48px)  |
| **Consistent transitions**     | Same duration and easing across similar interactions |

---

## H. Robustness, Redundancy, Recovery & Strategy (R3S)

> Systems fail. Networks drop. Services go down. R3S ensures every project survives failure -- not just avoids it.

### H.1 Robustness

| Rule                        | Standard                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| **Defensive coding**        | Every external call assumes failure. Try/catch on all network requests, DB queries, file ops |
| **Input resilience**        | Handle malformed, missing, and unexpected input gracefully                                   |
| **Progressive enhancement** | Core functionality works without JavaScript where possible                                   |
| **Graceful degradation**    | When a feature fails, surrounding features continue working                                  |
| **Error containment**       | Errors are isolated -- one broken API call doesn't crash the page                            |

### H.2 Redundancy & Fallback Priority Chain

Every data source in every project must follow this fallback chain:

```
1. Primary:        Live database / API query
2. Cache:          Cached / ISR response (if available)
3. Static:         Fallback data files in the codebase
4. Graceful empty: "Content coming soon" -- NEVER a crash
```

| Layer        | Standard                                                    |
| ------------ | ----------------------------------------------------------- |
| **Data**     | Critical data exists in 2+ locations (DB + static fallback) |
| **Services** | Primary service down = fallback exists                      |
| **Content**  | Every dynamic section has a static fallback                 |
| **Fonts**    | Self-hosted, no external CDN dependency                     |
| **Auth**     | Override mechanism if auth service fails                    |
| **Backups**  | Regular automated backups                                   |

### H.3 Recovery

| Scenario                 | Standard                                   | Max Downtime             |
| ------------------------ | ------------------------------------------ | ------------------------ |
| **App crash**            | Auto-restart via process manager           | < 5 seconds              |
| **Bad deploy**           | `git revert` + redeploy                    | < 5 minutes              |
| **Database unavailable** | Static fallback data serves public pages   | 0 (pages never blank)    |
| **SSL expiry**           | Auto-renewal via certbot cron              | 0 (renews 30 days early) |
| **Disk full**            | Log rotation, weekly log flush             | < 10 minutes             |
| **Corrupted data**       | Soft deletes + point-in-time restore       | < 30 minutes             |
| **Configuration drift**  | `.env.example` documents all required vars | < 15 minutes             |

**Recovery Runbook Template (use for every project):**

```
1. DETECT  -- How do you know something is wrong?
   - Process manager shows errored
   - Uptime monitor alerts
   - User reports

2. DIAGNOSE -- What broke?
   - Check process manager logs
   - Check web server error log
   - Check application logs

3. CONTAIN -- Stop the bleeding
   - If bad deploy: revert + rebuild + restart
   - If database issue: static fallbacks already serving
   - If DDoS: enable protection mode

4. FIX -- Resolve the root cause
   - Identify the actual bug/issue
   - Fix locally, test, commit, deploy

5. VERIFY -- Confirm recovery
   - Check all public pages load
   - Check admin/protected functionality
   - Verify process status: online
   - Run quality gates
```

### H.4 Strategy

| Rule                     | Standard                                             | Review Cycle         |
| ------------------------ | ---------------------------------------------------- | -------------------- |
| **Uptime monitoring**    | External checks on every production site             | Configure on launch  |
| **Incident log**         | Document every outage: cause, fix, prevention        | After every incident |
| **Dependency lifecycle** | Track EOL dates for major dependencies               | Quarterly            |
| **Capacity planning**    | Monitor disk usage, memory, connection counts        | Monthly              |
| **Exit strategy**        | Know how to migrate away from every service          | Document on adoption |
| **Knowledge continuity** | HANDOFF.md + CLAUDE.md keep any developer productive | Every session        |
| **Cost sustainability**  | Infrastructure costs reviewed and justified          | Quarterly            |

**Quarterly Strategic Health Questions:**

1. If the primary database went down right now, would public pages still render?
2. If the server was destroyed, how long to rebuild from scratch?
3. Are all dependencies actively maintained? Any approaching EOL?
4. Is infrastructure cost sustainable for the next 12 months?
5. Could a new developer get productive in less than 1 hour with the docs?
6. Are backups tested? When was the last restore test?

### H.5 Maintenance Schedule

| Frequency     | Tasks                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| **Weekly**    | Process manager status + logs, disk usage, IPS/fail2ban review, SSL cert check                   |
| **Monthly**   | Dependency audit, firewall logs, web server error logs, log flush                                |
| **Quarterly** | Full security audit, SSL Labs test, Lighthouse audit, dependency updates, database access review |

### H.6 R3S Checklist

| #   | Check                                                       |
| --- | ----------------------------------------------------------- |
| 1   | Every external API call has error handling and a fallback   |
| 2   | Static fallback data exists for all dynamic content         |
| 3   | Process manager auto-restarts on crash and boot             |
| 4   | A bad deploy can be reverted in < 5 minutes                 |
| 5   | SSL certificates auto-renew                                 |
| 6   | Database has automated backups                              |
| 7   | Log rotation prevents disk from filling                     |
| 8   | `.env.example` documents all required environment variables |
| 9   | Recovery runbook exists and is current                      |
| 10  | External uptime monitoring is configured                    |
| 11  | Incident log is maintained                                  |
| 12  | Dependency EOL dates are tracked                            |

---

## I. Responsible AI (RAI) Standards

| Rule                       | Standard                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| **Human review required**  | No AI output reaches end users without human review                                             |
| **Transparency**           | Users informed when AI assists analysis or content                                              |
| **No automated decisions** | AI suggests, humans decide                                                                      |
| **Bias awareness**         | Review AI output for stereotypes, assumptions, exclusions                                       |
| **Data minimization**      | Only include relevant data in AI prompts                                                        |
| **PII exclusion**          | Prefer keeping PII out of AI prompts entirely                                                   |
| **Output validation**      | Checklist before publishing AI-generated content                                                |
| **Continuous improvement** | Inaccurate outputs inform prompt refinement                                                     |
| **Scoring transparency**   | If scoring/ranking: algorithms are rule-based, auditable, and exclude protected characteristics |
| **Public disclosure**      | AI usage disclosed on /about or /ai-policy page                                                 |

**RAI Legal Alignment:**

| Framework          | Applicability                         |
| ------------------ | ------------------------------------- |
| COPPA              | Projects serving minors               |
| CCPA / CPRA        | Projects serving California residents |
| FERPA              | Educational projects                  |
| ADA / Section 508  | All public-facing projects            |
| EU AI Act          | Projects serving EU users             |
| OECD AI Principles | All AI-assisted projects              |

**RAI Incident Response:**

- Document incidents immediately
- Client notification within **72 hours** if user data or AI decisions were affected
- Root cause analysis + prevention plan within 1 week
- Update RAI standards if gap identified

---

## J. Testing Standards

### J.1 Coverage Targets

| Category                    | Target |
| --------------------------- | ------ |
| Utility functions           | 90%    |
| API routes / server actions | 80%    |
| Components / views          | 70%    |
| Overall                     | 70%    |

### J.2 Required Test Types

| Type              | What It Tests                                             |
| ----------------- | --------------------------------------------------------- |
| **Unit**          | Business logic, validation, utilities, scoring            |
| **Integration**   | API route handlers, database queries                      |
| **E2E**           | User flows, navigation, form submission                   |
| **Accessibility** | WCAG violations on every public page                      |
| **Security**      | Prohibited patterns, auth enforcement, field whitelisting |

### J.3 Security Test Suite (Required)

Every project must have automated tests that verify:

- No unsafe HTML injection patterns (except approved exceptions like JSON-LD)
- No unsafe type annotations or unchecked casts
- No dynamic code execution calls
- No secrets exposed in client bundles
- No debug logging in API routes
- Auth enforced on all protected routes
- Rate limiting on authentication endpoints
- Origin validation on state-changing requests
- Field whitelisting on all update routes
- Bias-free scoring: identical inputs with different demographic data produce identical outputs (if applicable)

### J.4 Quality Gates (All Must Pass Before Shipping)

| #   | Gate             | Required                                    |
| --- | ---------------- | ------------------------------------------- |
| 1   | Type check       | 0 errors                                    |
| 2   | Lint             | 0 errors                                    |
| 3   | Tests            | All passing                                 |
| 4   | Build            | 0 errors                                    |
| 5   | Dependency audit | 0 critical vulnerabilities                  |
| 6   | Security headers | A or higher (securityheaders.com)           |
| 7   | Lighthouse       | Performance 90+, Accessibility 100, SEO 90+ |

---

## K. Design Continuity Standards

| Aspect                          | Standard                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| **Color palette**               | Fully defined and documented before building                    |
| **Brand colors**                | Used consistently -- no off-brand colors in UI                  |
| **Component patterns**          | Cards, buttons, forms follow consistent patterns                |
| **Typography**                  | Hierarchy defined (h1-h6, body, caption) and followed           |
| **Spacing**                     | Scale defined and followed consistently                         |
| **Container widths**            | Consistent and appropriate for content type                     |
| **Header/Footer**               | Consistent across all pages                                     |
| **Dark mode**                   | If applicable, warm tone, consistent treatment                  |
| **Transitions**                 | Same duration and easing for similar interactions               |
| **No dynamic class generation** | Never build class names from variables -- use explicit mappings |

---

## L. Content Continuity Standards

For projects with structured content (articles, products, blog posts, etc.):

| Check                          | Standard                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| **Date integrity**             | No content dated in the future. Consistent date format           |
| **Metadata completeness**      | All published content has all required fields                    |
| **No duplicate metadata keys** | Frontmatter/config files have no silently-overwritten duplicates |
| **Referenced assets exist**    | Every image/file path in content resolves to an actual file      |
| **Prohibited patterns clean**  | Source code passes all security pattern scans                    |

The AI should generate stack-appropriate automated checks for these during project setup.

---

## M. Citation & Sourcing Standards

For content-heavy projects (educational sites, knowledge bases):

### 4-Tier Authority Model

| Tier | Type                     | Examples                                     | Acceptance                                |
| ---- | ------------------------ | -------------------------------------------- | ----------------------------------------- |
| 1    | Institutional Authority  | NIST, FDA, universities, government agencies | Auto-accepted if topic-specific and dated |
| 2    | Research & Standards     | arXiv, IEEE, Nature, peer-reviewed journals  | Accepted with identifiable authors        |
| 3    | Primary Company Sources  | Company X on its own product only            | Only for that company's own products      |
| 4    | Research-Grade Editorial | Pew Research, university surveys             | Survey/statistical data only              |

**Sourcing Rules:**

- Primary source only -- never secondary reporting
- Topic-specific -- generic information not acceptable
- Rolling 2-year freshness window
- Human verification required -- every external link verified manually
- Required attributes on links: `target="_blank"`, `rel="noopener noreferrer"`

---

## N. Compliance Matrix

| Standard              | When Required                         | Key Requirements                                     |
| --------------------- | ------------------------------------- | ---------------------------------------------------- |
| **WCAG 2.1 AA**       | Every project with UI                 | See Section D                                        |
| **COPPA**             | Projects serving minors (<13)         | Age-gating, parental consent, minimal collection     |
| **CCPA**              | Projects serving California residents | Privacy policy, data deletion, data export           |
| **OWASP Top 10**      | Every project with user input         | Input validation, auth, injection prevention         |
| **ADA / Section 508** | Every public-facing project           | WCAG compliance -- legal requirement                 |
| **UD Principles**     | Every project                         | 7 principles evaluation (Section F)                  |
| **UDL Framework**     | Content-heavy / educational projects  | Multiple means of engagement, representation, action |
| **SLA/Uptime**        | Every production project              | Defined recovery targets, monitored uptime           |

---

## O. Session Protocol

**Every AI-assisted coding session follows this protocol.**

**The AI must verify its project memory contains the Part II standards. If memory is empty or missing key standards, re-read this file and re-commit to memory before proceeding.**

### Starting a Session

1. Read `HANDOFF.md` for current state -- what was done last, what's in-progress, what's next, any blockers
2. Read `AUDIT.md` for open issues and failing dimensions
3. Read `ProjectHealth.md` for overall health and production readiness status
4. Check AI memory files for accumulated project knowledge
5. Run tests to confirm baseline
6. State understanding: "I've read the handoff. Here's what I understand: [summary]. Here's what I plan to do: [plan]."

### During a Session

- Follow the Eight Pillars on every line of code
- Mark todos complete as work progresses
- Note new issues discovered -- log them in `AUDIT.md` immediately
- Test before and after changes

### Ending a Session

1. Update `HANDOFF.md` -- what's done, what's in-progress, what's next, blockers, decisions made
2. Update `AUDIT.md` -- new issues found, issues resolved, score changes
3. Update `ProjectHealth.md` -- overall grade, production readiness status, open issue count
4. Run full test suite + build -- all must pass
5. Recommend next steps explicitly

---

## P. Meta-Audit -- The Audit That Audits the Auditor

> Standards are worthless if they aren't enforced, reviewed, and challenged.

### P.1 Self-Assessment Schedule

| Frequency         | Audit Type                                                                                | Output                        |
| ----------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| **Every session** | Quick compliance check against this document                                              | Issues logged                 |
| **Weekly**        | Security scan (all automated patterns from B.11)                                          | 0 findings or tracked         |
| **Monthly**       | Full pillar review (all 8 pillars scored), scorecard accuracy, dependency freshness       | Updated health dashboard      |
| **Quarterly**     | Standards document review -- is anything outdated? False negative testing. Recovery drill | Updated standards             |
| **Annually**      | External audit or peer review                                                             | Written report + action items |

### P.2 Standards Validation Questions (Ask Quarterly)

**Effectiveness:**

1. Has this standard prevented at least one real issue in the last 90 days?
2. Can a new developer understand and follow this standard without asking questions?
3. Is this standard automated or automatable?

**Currency:** 4. Are all referenced technologies still current and maintained? 5. Do security patterns reflect current OWASP guidance? 6. Are performance targets still industry-standard?

**Completeness:** 7. Has any new vulnerability type emerged that these standards don't cover? 8. Has any new accessibility standard been published that should be incorporated? 9. Are there code patterns in production that no standard currently catches?

**Enforcement:** 10. Are all automated scans running before each deploy? 11. Were any standards violated in the last 90 days? Why wasn't it caught? 12. Is the health tracker being updated every session?

### P.3 Grading the Standards Themselves

Score this document quarterly:

| Dimension              | Question                                                       | Score /10 |
| ---------------------- | -------------------------------------------------------------- | --------- |
| **Coverage**           | Does every code pattern have a standard?                       |           |
| **Enforceability**     | Can every standard be checked automatically or in < 2 minutes? |           |
| **Clarity**            | Can a junior developer understand every rule without guidance? |           |
| **Currency**           | Are all references, tools, and patterns current?               |           |
| **Adoptability**       | Can this document be dropped into a new project and work?      |           |
| **Completeness**       | Are all 8 pillars + security + quality + deployment covered?   |           |
| **Maintenance burden** | Is this document well-organized and navigable?                 |           |
| **Effectiveness**      | Did following this document prevent real issues?               |           |
| **Overall**            |                                                                | **/10**   |

**Target: 9+/10.** If below 8, schedule immediate review and updates.

### P.4 Standards Change Log

Every change to this document must be logged:

| Date | Section | What Changed | Why (what triggered it) |
| ---- | ------- | ------------ | ----------------------- |
|      |         |              |                         |

---

---

# PART III: Project Health Tracker -- Templates

The templates below define the structure for `AUDIT.md`, `ProjectHealth.md`, and `HANDOFF.md`. During project setup (Step 5), the AI creates these as **separate files** in the project, populates them with initial data, and keeps them updated every session.

- **`ProjectHealth.md`** -- Sections 1 (Health Dashboard) and 3 (Codebase Metrics), plus a production readiness checklist
- **`AUDIT.md`** -- Sections 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, and 13 (quality gates, issues, tech debt, security, accessibility, design, tests, RAI, audit history, scorecard, re-run instructions)
- **`HANDOFF.md`** -- Session continuity: what's done, in-progress, next, blockers, decisions, session history

---

## 1. Health Dashboard

| Dimension         | Score | Grade | Change | Notes |
| ----------------- | ----- | ----- | ------ | ----- |
| Quality Gates     |       |       |        |       |
| Code Quality      |       |       |        |       |
| Security          |       |       |        |       |
| Accessibility     |       |       |        |       |
| Performance       |       |       |        |       |
| i18n              |       |       |        |       |
| Inclusivity       |       |       |        |       |
| Bias              |       |       |        |       |
| Test Coverage     |       |       |        |       |
| Design Continuity |       |       |        |       |
| Tech Debt         |       |       |        |       |
| Dependencies      |       |       |        |       |
| Documentation     |       |       |        |       |
| **Overall**       |       |       |        |       |

**Scoring:** 0-10 per dimension. A+ (9.5+), A (9.0+), A- (8.5+), B+ (8.0+), B (7.0+), C (6.0+), D (5.0+), F (<5.0).

---

## 2. Quality Gates

| Gate             | Command | Result | Notes |
| ---------------- | ------- | ------ | ----- |
| Linting          |         |        |       |
| Type checking    |         |        |       |
| Build            |         |        |       |
| Tests            |         |        |       |
| Dependency audit |         |        |       |

### Vulnerability Detail

| Package | Severity | Path | Production Impact | Action |
| ------- | -------- | ---- | ----------------- | ------ |
|         |          |      |                   |        |

---

## 3. Codebase Metrics

| Metric                  | Value |
| ----------------------- | ----- |
| Source files            |       |
| Lines of code           |       |
| Components / modules    |       |
| API routes / endpoints  |       |
| Pages / views / routes  |       |
| Production dependencies |       |
| Dev dependencies        |       |
| Unit test cases         |       |
| E2E test cases          |       |

---

## 4. Issues Tracker

### Severity Definitions

| Severity | Definition                                                                 | SLA                     |
| -------- | -------------------------------------------------------------------------- | ----------------------- |
| CRITICAL | Blocks deployment, data loss risk, security exploit                        | Fix immediately         |
| HIGH     | Major functionality broken, security vulnerability, significant UX failure | Fix before launch       |
| MEDIUM   | Degraded experience, minor security concern, accessibility gap             | Fix before next session |
| LOW      | Cosmetic, minor inconsistency, nice-to-have improvement                    | Fix when convenient     |

### Open Issues

| ID  | Severity | Category | Issue | Found (Session) | Status |
| --- | -------- | -------- | ----- | --------------- | ------ |
|     |          |          |       |                 |        |

### Fixed Issues

| ID  | Severity | Category | Issue | Resolution | Session |
| --- | -------- | -------- | ----- | ---------- | ------- |
|     |          |          |       |            |         |

### Deferred Issues

| ID  | Phase/Reason | Issue | Target |
| --- | ------------ | ----- | ------ |
|     |              |       |        |

---

## 5. Tech Debt Register

| ID  | Class | Description | Owner | Target Date | Status |
| --- | ----- | ----------- | ----- | ----------- | ------ |
|     |       |             |       |             |        |

**TD Classes:**

- **TD-1 (Structural):** Shortcuts taken knowingly. Fix within 2 sessions. **Never accumulate more than 5.**
- **TD-2 (Code Quality):** Deprecated patterns that still work. Fix within 1 month.
- **TD-3 (Architecture):** Limitations that constrain growth. Fix within 1 quarter.
- **TD-4 (Legacy):** Untested code. Must have tests before next deploy.

Every TD item must have an owner and a target resolution date.

---

## 6. Security Posture

| Control                                   | Status | Notes |
| ----------------------------------------- | ------ | ----- |
| Input validation at all boundaries        |        |       |
| Field whitelisting on update operations   |        |       |
| Parameterized queries                     |        |       |
| No unsafe HTML injection with user data   |        |       |
| No dynamic code execution with user input |        |       |
| Auth on all protected routes              |        |       |
| Rate limiting on login                    |        |       |
| CSRF / origin validation                  |        |       |
| Security headers configured               |        |       |
| No hardcoded secrets                      |        |       |
| Environment files in .gitignore           |        |       |
| .env.example exists                       |        |       |
| No PII in logs                            |        |       |
| PII encrypted at rest                     |        |       |
| Dependency audit clean                    |        |       |

---

## 7. Accessibility Status

| Requirement                        | Status | Notes |
| ---------------------------------- | ------ | ----- |
| Language attribute on root element |        |       |
| Skip-to-content link               |        |       |
| Semantic landmarks                 |        |       |
| Image alt text                     |        |       |
| Color contrast 4.5:1               |        |       |
| Keyboard accessible                |        |       |
| Focus indicators                   |        |       |
| Touch targets 44x44px              |        |       |
| Reduced motion respected           |        |       |
| Heading hierarchy                  |        |       |
| Form labels                        |        |       |
| ARIA on custom widgets             |        |       |
| 200% zoom clean                    |        |       |
| Screen reader tested               |        |       |

---

## 8. Design Continuity Status

| Aspect                        | Status | Notes |
| ----------------------------- | ------ | ----- |
| Color palette defined         |        |       |
| Brand colors consistent       |        |       |
| Component patterns consistent |        |       |
| Typography hierarchy followed |        |       |
| Spacing scale followed        |        |       |
| Header/Footer consistent      |        |       |
| Button styling consistent     |        |       |
| Transitions consistent        |        |       |

---

## 9. Test Coverage

| Test File | Tests | Covers |
| --------- | ----- | ------ |
|           |       |        |

| Metric              | Target           | Actual |
| ------------------- | ---------------- | ------ |
| Unit test coverage  | 80%+             |        |
| E2E critical paths  | 100%             |        |
| Accessibility tests | All public pages |        |
| Security scan tests | All API routes   |        |

---

## 10. RAI Compliance (if applicable)

| Control                                    | Status |
| ------------------------------------------ | ------ |
| AI content reviewed before publish         |        |
| AI recommendations flagged as suggestions  |        |
| No autonomous actions affecting users      |        |
| Human override on all AI decisions         |        |
| Users know when AI is involved             |        |
| PII excluded from AI prompts               |        |
| Scoring algorithms auditable and bias-free |        |
| AI usage publicly disclosed                |        |

### RAI Incident Log

| Date | Incident | Severity | Resolution | Prevention | Client Notified |
| ---- | -------- | -------- | ---------- | ---------- | --------------- |
|      |          |          |            |            |                 |

---

## 11. Audit History

| Date | Session | Type | Score | Auditor | Key Changes |
| ---- | ------- | ---- | ----- | ------- | ----------- |
|      |         |      |       |         |             |

**Audit Types:** Full, Security-only, Pre-deploy, Post-incident, Dependency

---

## 12. Cross-Project Scorecard

Track health across all active projects:

| Project | Security | Quality | A11y | Performance | UD/UDL | R3S | Tests | Docs | Overall |
| ------- | -------- | ------- | ---- | ----------- | ------ | --- | ----- | ---- | ------- |
|         |          |         |      |             |        |     |       |      |         |

---

## 13. How to Re-Run This Audit

1. **Quality gates:** Run all commands in Section 2
2. **Codebase metrics:** Update counts in Section 3
3. **Security posture:** Walk through every row in Section 6
4. **Accessibility:** Test all public pages against Section 7
5. **Design continuity:** Visual review against Section 8
6. **Inclusivity & bias:** Content review against Part II, Section E
7. **UD/UDL:** Walk through checklist in Part II, Section F.3
8. **RAI:** Review against Section 10 (if applicable)
9. **Test coverage:** Run coverage report, update Section 9
10. **Dependencies:** Run dependency audit, check for unused imports
11. **Content continuity:** Run automated content checks
12. **Code smell scans:** Run all scans from Part II, Section B.11
13. **Bundle/build size:** Run build analysis
14. **Score:** Update Health Dashboard in Section 1
15. **Log:** Add entry to Audit History in Section 11
16. **Strategic questions:** If quarterly, answer the 6 questions in Part II, Section H.4

---

_This is a living document. It grows with the project. The standards in Part II are non-negotiable. The tracker in Part III adapts to each project. Mark sections N/A where they don't apply. Log every change to this document in the Standards Change Log (Part II, Section P.4)._
