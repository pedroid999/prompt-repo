# Deployment Guide

The application is currently deployed to **Vercel** (Next.js host) with a managed **Supabase** project as the database and auth backend. There is **no Docker image, no Kubernetes manifest, and no infrastructure-as-code** in the repo — deployment is fully managed by these two PaaS providers.

Live deployment (per `.mcp.json`): `https://prompt-repo-iota.vercel.app`.

## 1. Architecture at a glance

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│           Vercel            │         │           Supabase           │
│  (Next.js 15 App Router)    │         │  (managed PostgreSQL + Auth) │
│                             │         │                              │
│  • Server Components        │  TLS    │  • Postgres (all tables)     │
│  • Server Actions           │ ──────► │  • Auth (GoTrue)             │
│  • Edge Middleware          │         │  • RLS policies              │
│  • /api/mcp (route handler) │         │  • Search RPC + triggers     │
│  • Static assets            │         │  • pgcrypto for AI keys      │
└─────────────────────────────┘         └──────────────────────────────┘
            │
            │ (CORS-enabled)
            ▼
   MCP clients (Claude Desktop,
   Claude Code, Cursor, …)
```

## 2. CI

`.github/workflows/ci.yml` defines two jobs:

| Job | Triggers | Steps |
|-----|----------|-------|
| `test` | `push` to `main`, `pull_request` to `main` | `npm ci` → `npm test -- --run` → `npm run lint` |
| `build` | After `test` succeeds | `npm ci` → `npm run build` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from GitHub Secrets |

> ⚠ Notable gap: CI only runs against `main`. The default integration branch is `develop`, so feature branches and `develop` PRs are **not** gated until they're promoted to `main`. If you want earlier signal, add `develop` to the `branches:` arrays.
>
> ⚠ The `build` job does **not** receive `SUPABASE_SERVICE_ROLE_KEY`. The build will succeed because `service.ts` reads the env at runtime, not at build time, but the absence is worth noting if a future Server Component starts touching the service-role client at module-import time.

There is no automatic promotion from CI to Vercel — Vercel's GitHub integration handles deploys independently of GitHub Actions.

## 3. Vercel (Next.js host)

### One-time setup

1. Create the project at https://vercel.com/new → **Import Git Repository**.
2. Vercel auto-detects Next.js. No build-command override is needed (uses `npm run build`).
3. Add environment variables (Settings → Environment Variables):

| Variable | Scope | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview + Development | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview + Development | Supabase project → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (and Preview if MCP is exercised) | Supabase project → Settings → API → **service_role** secret |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Production | GitHub OAuth app |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Production | Google OAuth client |

> ⚠ `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Restrict its scope to **Production** unless you specifically need the MCP endpoint to work in Preview.

### What deploys

- **All Server Components and Server Actions** run as Vercel serverless functions (or edge, depending on per-route config — currently no `runtime: 'edge'` overrides are present).
- **`/api/mcp`** runs as a Node serverless function (it imports `crypto`-using libraries and the service-role client).
- **Edge Middleware** (`src/middleware.ts`) runs at the edge for every non-static request.
- **Static assets** in `public/` and Next.js's optimized images are served from Vercel's CDN.

### Promotion model

- Merging to `main` triggers a **Production** deployment.
- Pushes to other branches and PRs trigger **Preview** deployments. Each preview gets its own URL and uses the same env vars (Preview scope).

## 4. Supabase (database + auth)

### One-time setup

1. Create a new project at https://supabase.com.
2. Link it locally:

   ```bash
   supabase link --project-ref <project-id>
   ```

3. Push the migrations:

   ```bash
   supabase db push
   ```

   This applies every file in `supabase/migrations/` in order. The migrations are **idempotent enough** (they use `IF NOT EXISTS`/`OR REPLACE`) but they assume a clean target on first push.

4. **Enable Auth providers** in Dashboard → Authentication → Providers:
   - Email (enabled by default)
   - GitHub — paste in your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. Add the redirect `https://<project-id>.supabase.co/auth/v1/callback` to the GitHub OAuth app.
   - Google — same pattern.

5. **Configure email templates** if you want branded confirmation emails. Templates are in Dashboard → Authentication → Email Templates (or in `supabase/config.toml` for the local stack).

### Subsequent deploys

Apply new migrations with `supabase db push` from a developer machine that's linked to the project. There is currently **no automated migration pipeline** — schema deploys are manual.

> ⚠ Production RLS posture: every user-scoped table has full-CRUD policies gated by `auth.uid() = user_id`. The exceptions to be aware of:
> - `prompts`: a public-read policy applies when `is_public = true` (allows anonymous SELECT).
> - `prompt_versions`: only SELECT and INSERT policies exist — there are intentionally no UPDATE/DELETE policies (immutable history).
> - `user_api_keys` / MCP path: read via the service-role client, which bypasses RLS. The MCP tool handlers are responsible for filtering by `userId` themselves.

### Backups

Supabase managed projects ship daily PITR backups (paid plans). For free tier, configure a `pg_dump` cron externally if needed. There is no in-repo backup script.

## 5. Health & observability

There is **no built-in health endpoint, no Sentry/OpenTelemetry/StatsD wiring, no log aggregation**. Current observability:

| Source | What you can see |
|--------|------------------|
| Vercel Functions log | `console.error` from server actions and `/api/mcp` (e.g. `[MCP dispatcher] Unexpected error for method …`) |
| Supabase Logs Explorer | Postgres errors, auth events, slow queries |
| Vercel Analytics (if enabled) | Page views, Core Web Vitals |

If you need request-level tracing, add it explicitly — there's nothing in the repo to wire it up.

## 6. MCP endpoint specifics

- `/api/mcp` is excluded from session-redirect middleware (see `src/lib/supabase/middleware.ts`) so that API-key callers without browser session cookies aren't bounced to `/auth/login`.
- CORS headers (`Access-Control-Allow-Origin: *`, methods, headers) are set on every response so that browser-based MCP clients on different origins can call the endpoint.
- Errors return HTTP 200 with a JSON-RPC error envelope. Do **not** add an error-status mapping — that would break MCP client expectations.
- Authentication is `Authorization: Bearer <key>` (preferred) or `x-api-key: <key>` (fallback). Anonymous callers with no header receive public prompts only.

## 7. Rollback

- **Frontend:** Vercel → Deployments → pick the prior production deployment → "Promote to Production". Reversible in seconds.
- **Schema:** Migrations are forward-only. Roll back by writing a new migration that undoes the change. Never edit a previously-applied migration.
- **OAuth credentials:** If a key leaks, rotate in Supabase Auth → Providers, then update Vercel env vars and redeploy.

## 8. What's missing (deliberate or accidental — flagged)

| Gap | Status |
|-----|--------|
| No `Dockerfile` / container image | Not needed — Vercel builds from source. Add only if a non-Vercel target appears. |
| No `develop`-branch CI | Likely accidental. One-line fix in `.github/workflows/ci.yml`. |
| No automated DB migration pipeline | Deliberate today (small team, manual `supabase db push`). For team scale, wire up Supabase's GitHub integration or a `supabase db push` step in CI gated by an environment-protected secret. |
| No staging Supabase project | If preview deploys ever talk to the production DB, this is a footgun. Today, Vercel previews use the same Supabase project as production via the Preview-scoped env vars — flag if you start running destructive flows in previews. |
| No Sentry / OTel / structured logging | Deliberate; logs go to Vercel Functions and Supabase. Add only when an incident demands it. |
| `SUPABASE_SERVICE_ROLE_KEY` not provided to the CI build | Currently fine because the value is read at runtime, not build time. Will become a build-time failure if any RSC starts touching `service.ts` at module scope. |
