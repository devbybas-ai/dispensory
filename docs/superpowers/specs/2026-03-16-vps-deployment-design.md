# Dispensory VPS Deployment Design

> Date: 2026-03-16
> Status: Approved
> Domain: dispensory.builtbybas.com

---

## Overview

Deploy Dispensory to the existing BuiltByBas VPS (72.62.200.30) following the established pattern: dedicated Linux user, PM2, Nginx reverse proxy, Certbot SSL. Phase 1 runs Next.js only — Redis/BullMQ/Socket.io are coded to gracefully degrade and will be enabled later.

A 21+ age verification gate must be added before deployment (California DCC compliance requirement for cannabis retail sites).

### Pre-Deploy Code Changes

These changes must be made before deployment:

1. **REDIS_URL made optional** in `src/lib/env.ts` — was required, now `.optional()` for graceful degradation
2. **21+ age gate** — middleware check + `/age-verify` page (blocks deployment until implemented)
3. **`ecosystem.config.cjs`** — PM2 config file must be created in project root
4. **`AUTH_TRUST_HOST=true`** — required for Auth.js behind Nginx reverse proxy

---

## Infrastructure

| Component    | Value                                  |
| ------------ | -------------------------------------- |
| VPS IP       | 72.62.200.30                           |
| OS           | Ubuntu 24.04 LTS                       |
| Node.js      | v22.22.1                               |
| Linux user   | `dispensory` (nologin service account)  |
| Home dir     | `/var/www/dispensory`                   |
| Port         | 3006                                   |
| PM2 name     | `dispensory`                            |
| PM2 service  | `pm2-dispensory`                        |
| Domain       | dispensory.builtbybas.com               |
| GitHub       | devbybas-ai/dispensory (private)        |
| SSH alias    | github.com-devbybas-ai (existing)       |

---

## Database

- **Instance:** Existing PostgreSQL 17 on VPS (shared with BuiltByBas, Marketing Reset)
- **Database:** `dispensory`
- **User:** `dispensory_user` with password, scoped to `dispensory` database only
- **Schema push:** `DATABASE_URL=... pnpm db:push` after first clone
- **Seed:** `DATABASE_URL=... pnpm db:seed` for demo data

---

## Services (Phase 1)

| Service     | Status   | Notes                                      |
| ----------- | -------- | ------------------------------------------ |
| Next.js     | Enabled  | Main application on port 3006              |
| PostgreSQL  | Enabled  | Shared instance, dedicated DB              |
| Redis       | Disabled | Graceful degradation, REDIS_URL optional   |
| BullMQ      | Disabled | Workers not started, queues return null     |
| Socket.io   | Disabled | Realtime emit is no-op without Redis       |
| S3          | Disabled | File upload returns null without config    |
| Resend      | Disabled | Email falls back to console.log            |

All disabled services are designed to degrade gracefully — no errors, no crashes.

---

## Pre-Deploy Feature: 21+ Age Gate

### Requirements

- Interstitial page shown before ANY content loads (including login page)
- Asks visitor to confirm they are 21 years of age or older
- **Confirm:** Sets a session cookie, proceeds to the site
- **Deny:** Redirects to a "sorry" page or closes
- Cookie-based memory (lasts for the browser session, not persistent)
- Required by California DCC regulations for cannabis retail websites
- Must not be bypassable via direct URL navigation

### Implementation Approach

- Middleware-level check: if no age verification cookie, redirect to `/age-verify`
- `/age-verify` is a standalone page outside the dashboard layout
- On confirmation, sets `HttpOnly` cookie and redirects to original destination
- Clean, professional design consistent with the site brand

---

## VPS Setup Steps

### 1. DNS (do first — propagation takes time)

Add A record in Hostinger DNS panel:
- **Type:** A
- **Name:** dispensory
- **Value:** 72.62.200.30
- **TTL:** 3600

### 2. Create Linux User

```bash
sudo useradd -r -m -d /var/www/dispensory -s /usr/sbin/nologin dispensory
```

### 3. Create PostgreSQL Database

```bash
sudo -u postgres psql -c "CREATE USER dispensory_user WITH PASSWORD '<password>';"
sudo -u postgres psql -c "CREATE DATABASE dispensory OWNER dispensory_user;"
```

### 4. Clone Repository

```bash
sudo -u dispensory env PATH=/usr/local/bin:/usr/bin:/bin HOME=/var/www/dispensory bash -c '
  cd /var/www/dispensory &&
  git clone git@github.com-devbybas-ai:devbybas-ai/dispensory.git .
'
```

### 5. Configure Environment

```bash
sudo -u dispensory env PATH=/usr/local/bin:/usr/bin:/bin HOME=/var/www/dispensory bash -c 'cat > /var/www/dispensory/.env << EOF
DATABASE_URL=postgresql://dispensory_user:<password>@localhost:5432/dispensory
NODE_ENV=production
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://dispensory.builtbybas.com
NEXT_PUBLIC_APP_NAME=Dispensory
PORT=3006
EOF
chmod 600 /var/www/dispensory/.env'
```

**Note:** Using `.env` (not `.env.local`) because Prisma's `dotenv/config` loads `.env` by default.

### 6. Build and Start

```bash
sudo -u dispensory env PATH=/usr/local/bin:/usr/bin:/bin HOME=/var/www/dispensory bash -c '
  cd /var/www/dispensory &&
  pnpm install --frozen-lockfile &&
  set -a && source .env && set +a &&
  pnpm db:push &&
  pnpm db:seed &&
  pnpm build &&
  pm2 start ecosystem.config.cjs &&
  pm2 save
'
```

### 7. PM2 Startup

```bash
sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u dispensory --hp /var/www/dispensory
```

### 8. Nginx Configuration

```bash
sudo tee /etc/nginx/sites-available/dispensory << 'EOF'
server {
    server_name dispensory.builtbybas.com;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 80;
}
EOF
sudo ln -s /etc/nginx/sites-available/dispensory /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 9. SSL (after DNS propagates)

```bash
sudo certbot --nginx -d dispensory.builtbybas.com
```

Verify DNS first: `dig dispensory.builtbybas.com` — must resolve to 72.62.200.30.

---

## Deploy Flow (Ongoing)

```bash
ssh -i ~/.ssh/orcachild_vps -p 2222 orcachild@72.62.200.30
sudo -u dispensory env PATH=/usr/local/bin:/usr/bin:/bin HOME=/var/www/dispensory bash -c '
  cd /var/www/dispensory &&
  git pull &&
  pnpm install --frozen-lockfile &&
  pnpm build &&
  pm2 restart dispensory &&
  pm2 logs dispensory --lines 5
'
```

For schema changes, add before build:
```bash
set -a && source .env && set +a && pnpm db:push
```

### Rollback

If a deployment fails or the new version crashes:
```bash
sudo -u dispensory env PATH=/usr/local/bin:/usr/bin:/bin HOME=/var/www/dispensory bash -c '
  cd /var/www/dispensory &&
  git checkout HEAD~1 &&
  pnpm build &&
  pm2 restart dispensory
'
```

---

## PM2 Ecosystem Config

File: `ecosystem.config.cjs` (must be created in project root before first deploy)

```js
module.exports = {
  apps: [{
    name: 'dispensory',
    script: 'node_modules/.bin/next',
    args: 'start --port 3006',
    cwd: '/var/www/dispensory',
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '250M',
  }],
};
```

---

## Security Considerations

- `.env` file: chmod 600, owned by `dispensory` user only
- No app port exposed in UFW (traffic goes through Nginx on 443)
- AUTH_SECRET generated with `openssl rand -base64 32`
- AUTH_TRUST_HOST=true for Auth.js behind reverse proxy
- Database user scoped to `dispensory` database only
- Age gate prevents underage access to any content
- All existing security middleware (CSP, HSTS, CSRF) applies in production

---

## Phase 2 (Future)

When a real client deployment is needed:
- Enable Redis on VPS (or dedicated instance)
- Start BullMQ workers as separate PM2 processes
- Start Socket.io server as separate PM2 process
- Configure S3-compatible storage
- Configure Resend for transactional email
- Consider dedicated VPS for cannabis data isolation

---

## Updated Project Registry Entry

```
### Dispensory
- **Owner:** Bas Rosario
- **Local:** c:\dispensory\
- **VPS:** /var/www/dispensory
- **Port:** 3006
- **PM2:** dispensory
- **GitHub:** devbybas-ai/dispensory (private)
- **SSH Alias:** github.com-devbybas-ai
- **Stack:** Next.js + TypeScript + PostgreSQL + Tailwind + shadcn/ui
- **Domain:** dispensory.builtbybas.com
```
