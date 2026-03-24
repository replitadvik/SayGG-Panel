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
    generate.tsx    — Game-aware key generation (select game → load durations)
    users.tsx       — User management, approve/decline
    balance.tsx     — Balance topup for users
    referrals.tsx   — Referral code CRUD (role-filtered: owner sees all, admin sees own)
    games.tsx       — Game Management hub with duration counts (owner only)
    game-durations.tsx — Per-game duration/pricing with breadcrumb nav (owner only)
    connect-config.tsx — Dedicated Connect Config page: full secret view, copy, edit, rotate, audit log (owner only)
    settings.tsx    — Site name, features, mod name, ftext, maintenance, session config
    profile.tsx     — Username/password/telegram/2FA changes

server/
  index.ts          — Express app setup
  db.ts             — PostgreSQL pool + Drizzle instance
  auth.ts           — hashPassword (md5->sha256), key gen, helpers
  storage.ts        — IStorage interface + DatabaseStorage impl
  routes.ts         — All API routes + session config + /connect API

shared/
  schema.ts         — Drizzle tables + Zod schemas + types

seed.ts             — Database seeder (admin + default prices/features + PUBG game)
migrations/         — Drizzle migration files

loader/
  Login.h           — JNI header: ConnectResponse struct, native_Check declaration, helpers
  Login.cpp         — JNI impl: Android serial gen, curl POST, nlohmann/json parse, MD5 token verify
  json.hpp          — STUB: replace with real nlohmann/json v3.11.3 single-header
  Android.mk        — ndk-build configuration
  CMakeLists.txt    — CMake build alternative
  java/com/keypanel/loader/Login.java — Java companion (loadLibrary + native bridge)

expo-test-app/      — React Native (Expo) connect endpoint tester
  src/App.tsx       — Main test UI
  eas.json          — EAS Build profiles (APK + AAB)

docs/
  connect-integration.md   — Connect endpoint API reference
  expo-test-app.md         — Expo test app setup guide
  multi-game-management.md — Multi-game system documentation
```

## Database Tables
- `users` — accounts with level (1=Owner, 2=Admin, 3=Reseller), balance, device binding
- `keys_code` — license keys with game, duration, device tracking, key_reset_time (integer counter as text)
- `referral_code` — registration codes with level/balance presets
- `price_config` — duration->price mapping
- `feature` — game feature toggles (ESP, AIM, etc.)
- `site_config` — site name (dynamic branding displayed in header, login, browser title)
- `modname` — mod name setting
- `_ftext` — floating text/credit config
- `onoff` — maintenance mode toggle
- `history` — activity log
- `login_throttle` — brute-force protection (5 attempts -> 15min block)
- `connect_config` — game name + license secret rotation (active/previous secret, version, grace period)
- `session_settings` — configurable session TTL durations (normalTtl, rememberMeTtl, changedBy, changedAt)
- `games` — multi-game definitions (name, slug, displayName, description, isActive)
- `game_durations` — per-game pricing tiers (gameId FK, durationHours, label, price, isActive)

## Key Business Logic
- Key format: `SayGG_[DurationLabel]_[5-char-random]`
- Reseller restrictions: max 2 devices, no custom keys
- Key device reset: non-owners limited to 3 resets (tracked via key_reset_time counter)
- User device reset: limit 2 per 24 hours (PHP parity with deviceResetLimit=2)
- Extend duration: POST /api/keys/:id/extend with format "30D" or "12H"
- Ban user (status=2): blocks all their keys (keys_code.status=0 where registrator=username)
- Admin delete: can only delete referred Resellers (uplink=admin.username AND level=3)
- Admin referral: restricted to Reseller-only (level=3)
- Forgot password: OTP via Telegram, session-based reset flow
- Connect API at POST `/connect` (game client auth endpoint)
- Connect secret: stored in DB (`connect_config` table), bootstrapped from `CONNECT_BOOTSTRAP_SECRET` env var
- Secret rotation: Owner can rotate via Settings, supports grace period for previous secret
- Game name: configurable in DB via Settings (Owner only), defaults to `CONNECT_GAME_NAME` env var
- Currency: configurable via `VITE_DEFAULT_CURRENCY_SYMBOL` env var (default ₹/INR), all frontend uses `formatCurrency()`
- C++ Loader: `loader/Login.h` + `loader/Login.cpp` — configurable via ENDPOINT_URL, GAME_NAME, LICENSE_SECRET macros
- Multi-game: games table with per-game durations; key gen selects game → loads durations → prices from game_durations
- Connect endpoint: validates game against DB, enriched response (gameDisplayName, durationLabel, timeLeft, device usage)
- Password hash: md5(plain) -> sha256(md5)

## Session Management
- Configurable session TTL: normal (default 30m) and Remember Me (default 24h)
- TTL format: `Nm` (minutes), `Nh` (hours), `Nd` (days) — e.g. "30m", "24h", "7d"
- Priority: DB `session_settings` > env vars (`AUTH_NORMAL_TOKEN_TTL`, `AUTH_REMEMBER_ME_TOKEN_TTL`) > hardcoded defaults
- Owner-only Settings page to configure session durations + reset to defaults
- Login page includes "Remember Me" checkbox; sets cookie maxAge per resolved TTL
- Session expiry detection: auth context polls `/api/auth/me` every 2 minutes; shows toast on session expiry
- API: `GET/PATCH /api/settings/session`, `POST /api/settings/session/reset` (Owner only)

## Security Hardening (Production)
- Session cookie: `secure: true` in production, `httpOnly: true`, `sameSite: lax`
- Rate limiting: forgot-password (5/min), device-reset (5/min), reset-password (10/min), verify-otp (10/min)
- OTP brute-force: max 5 failed attempts invalidates session OTP
- Bulk-delete RBAC: non-owners can only delete their own keys
- GET /api/users/:id RBAC: non-owners can only view self or their referred users
- Password validation: 6-45 char enforcement on all change endpoints
- Dead code removed: unused imports (passport, memorystore, sql, boolean, ne, ilike, getDurationLabel, formatDuration, storage in auth.ts)

## UI/UX Design System
- Premium admin panel with dark header + white content design language
- Font: system-ui + Inter (SF Pro fallback) via CSS custom property --font-sans
- Primary color: amber/gold (43 72% 48%)
- Panel header: dark charcoal (240 21% 15% light / 240 19% 20% dark) — used for app header, card section headers, auth icon boxes, sidebar avatar
- Light theme: off-white bg (0 0% 97.5%), white cards, subtle borders
- Dark theme: deep dark bg (228 16% 6%), refined surfaces (228 14% 9%)
- ThemeProvider: localStorage-persisted light/dark toggle, respects prefers-color-scheme
- Layout: sticky dark `bg-panel-header` header (white text/icons, site name left, theme toggle + hamburger right), right-side Sheet drawer nav
- Card section pattern: `rounded-lg overflow-hidden` card with `bg-panel-header px-5 py-3` dark header bar (white icon + title) + `p-5` white content area
- Auth pages: centered card with `bg-panel-header` icon box (white icons)
- Shape system: sharp/boxy with max 6-8px radius (NO rounded-full, rounded-xl, or rounded-2xl anywhere)
  - Tailwind radius override: sm=2px, DEFAULT/md=4px, lg=6px, xl/2xl=8px
  - Cards/containers: rounded-lg (6px), shadow-sm, border-border/60
  - Inputs/selects: rounded (4px), h-11, bg-muted/50, border-border/60
  - Buttons: rounded (4px), h-10/h-11
  - Badges: rounded (4px)
  - Icon containers: rounded-lg (6px)
  - Avatar: rounded-lg (6px), square/boxy style
  - Switch/slider: rounded (4px) track, rounded-sm (2px) thumb
  - Radio: rounded-sm (2px)
- Navigation: right-side Sheet with user avatar, level badge, balance display
- All pages use consistent card-based layout (no Table components on mobile)
- data-testid attributes on all interactive and meaningful display elements

## Default Credentials
- Owner: `SayGG` / `Sk.kiru@96` (level 1)

## WebSocket Real-Time System
- **Server**: `server/websocket.ts` — WebSocket server on `/ws` path, authenticated via session middleware
  - Typed event system (`WsEventType`): keys/users/referrals/games/durations/settings/connect/balance/dashboard events
  - Role-scoped broadcasting: `emitScopedKeyEvent` (owner sees all, registrator sees own), `emitScopedUserEvent` (owner sees all, uplink sees referred), `emitToOwners`, `emitToAdminsAndAbove`, `emitToAll`, `emitToUser`
  - Heartbeat ping/pong every 30s, auto-cleanup of dead connections
- **Client**: `client/src/lib/useWebSocket.ts` — React hook with auto-connect, exponential backoff reconnect
  - `EVENT_TO_QUERY_KEYS` mapping: each WS event type maps to TanStack Query keys for automatic cache invalidation
  - Connected via `WebSocketManager` component in `App.tsx` (inside `AuthProvider`)
- **Integration**: `server/index.ts` passes session middleware to `setupWebSocket()` for auth on upgrade
- **Events emitted from**: all mutation routes in `server/routes.ts` (create/update/delete keys, users, referrals, games, durations, settings, balance, connect config)

## Performance Optimizations
- **Database indexes**: `idx_users_uplink`, `idx_users_status`, `idx_users_level`, `idx_keys_registrator`, `idx_keys_game_userkey`, `idx_keys_game_id`, `idx_keys_status`, `idx_game_durations_game_id`
- **Dashboard stats**: `getDashboardStats()` / `getDashboardStatsByUser()` — single SQL query with `COUNT(*) FILTER` instead of fetching all rows and counting in JS
- **Bulk delete**: `deleteKeys()` uses `IN (...)` single query instead of N+1 loop
- **Key count**: `getKeyCountByGameId()` uses `COUNT(*)` aggregate instead of full row select
- **Owner key generation**: Owner (level=1) bypasses balance check entirely, cost shown as "Free (Owner)" in UI

## Running
- Workflow "Start application" runs `npm run dev` on port 5000
- Seed: `npx tsx seed.ts`
- Push schema: `npm run db:push`
