# Key-Panel — Admin Panel Migration

## Overview
Migration of a PHP CodeIgniter 4 admin panel ("Key-Panel") to a modern TypeScript full-stack application. Manages software license keys, users, and game features.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TanStack Query + Wouter + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript + Drizzle ORM
- **Database**: PostgreSQL
- **Auth**: Session-based (express-session + connect-pg-simple)

## Architecture
```
client/src/
  App.tsx           — Router with auth guards
  lib/auth.tsx      — Auth context (useAuth hook)
  lib/queryClient.ts— TanStack Query client + apiRequest helper
  components/
    layout.tsx      — Sidebar layout with nav + header
    ui/             — shadcn components
  pages/
    login.tsx       — Login + 2FA OTP verification
    register.tsx    — Registration with referral code
    forgot-password.tsx — Forgot/reset password via OTP
    device-reset.tsx — Device binding reset (username+password)
    dashboard.tsx   — Stats cards (keys, users, balance)
    keys.tsx        — Key list with CRUD, bulk delete, search, extend duration
    generate.tsx    — Key generation form
    users.tsx       — User management, approve/decline
    balance.tsx     — Balance topup for users
    referrals.tsx   — Referral code CRUD
    prices.tsx      — Price configuration (owner only)
    settings.tsx    — Features, mod name, ftext, maintenance
    profile.tsx     — Username/password/telegram/2FA changes

server/
  index.ts          — Express app setup
  db.ts             — PostgreSQL pool + Drizzle instance
  auth.ts           — hashPassword (md5->sha256), key gen, helpers
  storage.ts        — IStorage interface + DatabaseStorage impl
  routes.ts         — All API routes + session config + /connect API

shared/
  schema.ts         — Drizzle tables + Zod schemas + types

seed.ts             — Database seeder (admin + default prices/features)
migrations/         — Drizzle migration files
```

## Database Tables
- `users` — accounts with level (1=Owner, 2=Admin, 3=Reseller), balance, device binding
- `keys_code` — license keys with game, duration, device tracking, key_reset_time (integer counter as text)
- `referral_code` — registration codes with level/balance presets
- `price_config` — duration->price mapping
- `feature` — game feature toggles (ESP, AIM, etc.)
- `modname` — mod name setting
- `_ftext` — floating text/credit config
- `onoff` — maintenance mode toggle
- `history` — activity log
- `login_throttle` — brute-force protection (5 attempts -> 15min block)

## Key Business Logic
- Key format: `PowerHouse_[DurationLabel]_[5-char-random]`
- Reseller restrictions: max 2 devices, no custom keys
- Key device reset: non-owners limited to 3 resets (tracked via key_reset_time counter)
- User device reset: limit 2 per 24 hours (PHP parity with deviceResetLimit=2)
- Extend duration: POST /api/keys/:id/extend with format "30D" or "12H"
- Ban user (status=2): blocks all their keys (keys_code.status=0 where registrator=username)
- Admin delete: can only delete referred Resellers (uplink=admin.username AND level=3)
- Admin referral: restricted to Reseller-only (level=3)
- Forgot password: OTP via Telegram, session-based reset flow
- Connect API at POST `/connect` (game client auth endpoint)
- Static words: `Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E`
- Password hash: md5(plain) -> sha256(md5)

## Security Hardening (Production)
- Session cookie: `secure: true` in production, `httpOnly: true`, `sameSite: lax`
- Rate limiting: forgot-password (5/min), device-reset (5/min), reset-password (10/min), verify-otp (10/min)
- OTP brute-force: max 5 failed attempts invalidates session OTP
- Bulk-delete RBAC: non-owners can only delete their own keys
- GET /api/users/:id RBAC: non-owners can only view self or their referred users
- Password validation: 6-45 char enforcement on all change endpoints
- Dead code removed: unused imports (passport, memorystore, sql, boolean, ne, ilike, getDurationLabel, formatDuration, storage in auth.ts)

## Default Credentials
- Owner: `admin` / `admin123` (level 1)

## Running
- Workflow "Start application" runs `npm run dev` on port 5000
- Seed: `npx tsx seed.ts`
- Push schema: `npm run db:push`
