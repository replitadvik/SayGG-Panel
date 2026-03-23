# Key-Panel (TypeScript Migration)

Admin panel for managing license keys, users, referrals, and game feature flags.
Migrated from PHP CodeIgniter 4 to TypeScript full-stack.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express 5, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based (express-session + connect-pg-simple)

## Quick Start on Replit

1. The PostgreSQL database is already provisioned via Replit.
2. Click **Run** or use the workflow "Start application" to launch.
3. The app will push the schema automatically via `drizzle-kit push`.
4. Run the seed script to create the default admin account:

```bash
npx tsx seed.ts
```

5. Login with `admin` / `admin123`.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes (auto-set on Replit) |
| `SESSION_SECRET` | Secret for session signing | Yes |
| `PORT` | Server port (default 5000) | No |
| `NODE_ENV` | `development` or `production` | No |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Express + Vite HMR) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:push` | Push schema to database |
| `npx tsx seed.ts` | Seed default admin + prices |

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Owner (level 1, full access)

## Role System

| Level | Name | Access |
|---|---|---|
| 1 | Owner | Full access to all features |
| 2 | Admin | User management, key management, referrals, balance |
| 3 | Reseller | Own keys only, max 2 devices per key, no custom keys |

## Project Structure

```
├── client/src/          # React frontend
│   ├── pages/           # Page components
│   ├── components/      # UI components (shadcn/ui)
│   ├── lib/             # Auth context, query client
│   └── hooks/           # Custom hooks
├── server/              # Express backend
│   ├── index.ts         # App entry point
│   ├── routes.ts        # All API routes
│   ├── storage.ts       # Database access layer
│   ├── auth.ts          # Password hashing, key generation
│   └── db.ts            # Database connection
├── shared/
│   └── schema.ts        # Drizzle schema + Zod validation
├── seed.ts              # Database seeder
├── .env.example         # Environment template
└── MIGRATION_MAPPING.md # PHP-to-TS route/model mapping
```
