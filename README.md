# SayGG Panel

Admin panel for managing license keys, users, referrals, and game feature flags.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express 5, TypeScript
- **Database**: PostgreSQL (Neon for Vercel / Replit Postgres for Replit)
- **Auth**: Session-based (express-session + connect-pg-simple)

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret for session signing (64+ char random string) | Yes |
| `NODE_ENV` | `development` or `production` | Yes (production on Vercel) |
| `CONNECT_BOOTSTRAP_SECRET` | Shared secret for /connect token formula | No (hardcoded default) |
| `CONNECT_GAME_NAME` | Game name validated by /connect (default: PUBG) | No |
| `BOOTSTRAP_OWNER_USERNAME` | Creates first owner account on empty DB | No |
| `BOOTSTRAP_OWNER_PASSWORD` | Password for first owner account | No |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Express + Vite HMR) |
| `npm run build` | Build for Replit production |
| `npm start` | Run production build |
| `npm run db:push` | Push schema to database |

## Deployment

### Replit
1. Set `DATABASE_URL` and `SESSION_SECRET` in Replit Secrets
2. Click **Run** — migrations run automatically on startup
3. Create your first owner account via the panel's register page

### Vercel
1. Create a free [Neon](https://neon.tech) database and copy the connection string
2. Push this repo to GitHub
3. Import the GitHub repo on [Vercel](https://vercel.com)
4. Add environment variables (see table above) in Vercel → Settings → Environment Variables
5. Deploy — migrations run automatically on first request
6. Set up the Cloudflare Worker (see `proxy/cloudflare-worker.js`) to handle the game loader's malformed headers

## Project Structure

```
├── client/src/          # React frontend
│   ├── pages/           # Page components
│   ├── components/      # UI components (shadcn/ui)
│   ├── lib/             # Auth context, query client
│   └── hooks/           # Custom hooks
├── server/              # Express backend (Replit / direct Node.js)
│   ├── index.ts         # Entry point with TCP header-sanitising proxy
│   ├── routes.ts        # All API routes including /connect
│   ├── storage.ts       # Database access layer
│   ├── auth.ts          # Password hashing, key generation
│   └── db.ts            # Database connection
├── api/                 # Vercel serverless function entry point
│   ├── index.ts         # Vercel handler
│   └── app.ts           # Express app bootstrap for Vercel
├── proxy/
│   ├── cloudflare-worker.js  # Strips malformed headers, proxies to backend
│   └── nginx.conf            # Alternative: nginx with ignore_invalid_headers
├── shared/
│   └── schema.ts        # Drizzle schema + Zod validation
├── script/
│   ├── build.ts         # Production build for Replit
│   └── build-vercel.ts  # Production build for Vercel
└── .env.example         # Environment variable template
```

## The /connect Endpoint

The game loader sends a malformed HTTP header `"Charse t: UTF-8"` (space in the name). Standards-compliant reverse proxies reject this before application code runs. The fix is a **Cloudflare Worker** (`proxy/cloudflare-worker.js`) that sits in front of the backend, accepts the raw connection, strips the invalid header, and forwards a clean request.

Flow: `Game Loader → Cloudflare Worker (strips bad header) → Backend → JSON response`
