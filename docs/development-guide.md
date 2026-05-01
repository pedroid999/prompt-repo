# Development Guide

How to get the project running locally, how the day-to-day commands behave, and the conventions to follow when you're shipping changes.

## 1. Prerequisites

- **Node.js 20+** (CI pins to `actions/setup-node@v4` with `node-version: '20'`).
- **npm** (no `pnpm-lock.yaml` or `yarn.lock` — npm is the package manager).
- **Docker** (required by `npx supabase start` to run the local Postgres + auth services).
- **Supabase CLI** — install once with `npm install -g supabase`.

## 2. First-run setup

```bash
git clone <repo-url>
cd prompt-repo

# Install JS dependencies
npm install

# Boot the local Supabase stack (Postgres, GoTrue, Storage, Studio, Mailpit)
npx supabase start

# Apply the schema and seed if you ever need a clean slate
npx supabase db reset
```

`npx supabase start` prints local URLs (Studio, Mailpit, etc.) and the **anon** + **service_role** keys you'll need for `.env.local`.

## 3. Environment variables

Create `.env.local` (gitignored):

```env
# Required (read by both the browser bundle and Server Components)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase status`>

# Required for the MCP server (api/mcp uses createServiceClient)
SUPABASE_SERVICE_ROLE_KEY=<service_role key from `supabase status`>

# Optional — only needed if you exercise OAuth locally
GITHUB_CLIENT_ID=…
GITHUB_CLIENT_SECRET=…
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
```

> ⚠ The service-role key bypasses RLS. Never expose it to the client bundle. Only the **`api/mcp` route handler** and `src/lib/supabase/service.ts` (server-only) should reference it.

`supabase/config.toml` controls local ports and templates. Inspect it before changing them — the project assumes the defaults.

## 4. Day-to-day commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Next.js dev server at `http://localhost:3000` (hot reload, App Router enabled). |
| `npm run build` | Production build — same as CI's `build` job. |
| `npm start` | Serve the production build (after `npm run build`). |
| `npm run lint` | ESLint flat config (`next/core-web-vitals` + `next/typescript`). |
| `npm test` | Vitest in watch mode. |
| `npm test -- --run` | One-shot run (this is what CI uses). |
| `npx vitest run src/path/to/file.test.ts` | Run a single test file. |
| `npx vitest --ui` | Vitest UI (graphical test runner). |
| `npx supabase start` | Boot the local Postgres + auth stack. |
| `npx supabase stop` | Stop it (preserves volumes). |
| `npx supabase db reset` | Drop, recreate, and re-apply every migration in `supabase/migrations/`. |
| `npx supabase status` | Print local URLs and the anon/service-role keys. |

> ⚠ **Per project convention (CLAUDE.md): do not run `npm run build` after every change.** It's slow. Trust `npm test` and `npm run lint` for fast feedback.

## 5. Local auth flow

- **Email/password** — when you sign up, Supabase issues a confirmation email. Locally, those emails land in **Mailpit at `http://localhost:54324`** — open it, click the magic link, you're in.
- **OAuth (GitHub / Google)** — register OAuth apps with redirect `http://localhost:54321/auth/v1/callback`, put the IDs/secrets in `.env.local`, restart `supabase start`. The flow then routes through `src/app/auth/callback/route.ts`.
- **Reset / wipe** — `npx supabase db reset` drops the auth schema too. You'll need to sign up again.

## 6. Test layout & strategy

- **Framework:** Vitest 4 + React Testing Library + jsdom. Setup in `vitest.config.ts` and `vitest.setup.ts` (mocks `ResizeObserver`, stubs `scrollIntoView`, registers `@testing-library/jest-dom` matchers).
- **Discovery:** `**/*.test.{ts,tsx}` and `**/*.spec.{ts,tsx}`. Co-locate test files next to their subject.
- **Coverage areas (current):**
  - Server Actions: `*/actions.test.ts` for `prompts`, `collections`, `snapshots`, `ai-providers`, `ai-composer`.
  - MCP dispatcher + tools: `features/mcp/dispatcher.test.ts`, `features/mcp/tools/*.test.ts`.
  - Supabase clients: `lib/supabase/middleware.test.ts`, `lib/supabase/schema-verify.test.ts`.
  - Helpers: `lib/utils/variable-parser.test.ts`, `features/prompts/utils/diff.test.ts`, `features/resolution-engine/utils/hydration.test.ts`, `lib/api-keys/{hash,verify}.test.ts`, `lib/crypto/provider-keys.test.ts`.
  - Validation schemas: `lib/validation/{prompt,ai-providers,ai-composer}.test.ts`.
  - Components: `components/ui/command.test.tsx`, `components/shared/back-button.test.tsx`, `components/features/search/command-palette.test.tsx`, `app/layout-metadata.test.ts`.
- **Test summary** of the original implementation pass: `_bmad-output/implementation-artifacts/tests/test-summary.md`.
- **Verification recipes** that exceed unit-test scope live in `docs/verification/` (e.g. `rls-isolation.md`).

## 7. Coding conventions (don't fight them)

These are observed across the codebase. Stay consistent with what's there.

### Project-level (from CLAUDE.md)

- **Mutations are Server Actions, not API routes.** Don't add a route handler for a mutation — write `'use server'` instead. The only HTTP routes that exist (`/api/mcp`, `/auth/callback`) are there for protocols that genuinely need HTTP.
- **Data fetching: async Server Components.** Avoid client-side `fetch` for first-render data.
- **Path alias `@/*`** is mandatory across module boundaries; relative paths only within the same folder.
- **Theme:** dark-mode-only right now (`<html className="dark">` in `app/layout.tsx`). Kanagawa hex colors are hardcoded — `bg-[#16161D]`, `bg-[#1F1F28]`, `text-[#DCD7BA]`. Don't migrate to CSS variables without coordination.
- **`cn()`** for conditional class composition. Always.
- **UI density target ~400px width.** Sidebar scrollable, dialogs full-screen on mobile, `md:` for everything wider.
- **Keyboard shortcuts are part of the product.** `Cmd+K`, arrow nav in the prompt list, `Ctrl+C/V` in the editor — preserve them.

### Per-module (from observation)

- **Feature module shape:** `actions.ts`, optional `queries.ts`, `components/`, `types.ts` (or `types/index.ts`), optional `hooks/`, `utils/`, `providers/`, `schemas.ts`. Mirror this when you add a new feature.
- **Server Action result shape:** prefer `{ success: true, data } | { success: false, error: string }` (used by `prompts/*`, `api-keys`, `ai-providers`, `ai-composer`, `snapshots`). The older `collections/actions.ts` returns `{ data, error }`; don't replicate that pattern in new code.
- **Validation:** Zod v4 schemas in `src/lib/validation/*.ts`. Use `safeParse` and surface the first issue's message in the action's error string.
- **Result of mutation → revalidate:** `revalidatePath('/')` after writes. There is no `revalidateTag` use; if you introduce one, document the tag name conventions.
- **Tests next to code:** `<file>.test.ts(x)` — never a separate `__tests__` directory.

### Server-only modules

If you write a module that must never reach the client bundle (e.g. anything touching the service-role key, the pgcrypto RPCs, server-side env vars), import the `server-only` package at the top:

```ts
import 'server-only';
```

This is already done in `src/lib/supabase/service.ts`. Replicate the pattern for new server-only utilities.

## 8. Working with the database

### Adding or changing a table

1. Create a new migration: `supabase/migrations/<timestamp>_<short_name>.sql`. The current convention is `YYYYMMDDHHMMSS_description.sql` (e.g. `20260314000009_user_ai_providers.sql`).
2. Apply locally: `npx supabase db reset` (full reset) or `npx supabase migration up` (incremental).
3. Add RLS policies for the new table — RLS is the authorisation model. Never deploy a table without policies.
4. Update the FTS triggers if the new table contributes to search content.
5. If you change `prompts`, remember the search-token trigger composition (`title=A`, `description=B`, `content=C` weighted tsvector).
6. Add or update a test in `lib/supabase/schema-verify.test.ts` if you want a regression check.

### Working with the search RPC

`search_prompts(query_text, filter_user_id, filter_collection_id, filter_archived)` is the only place that runs `tsquery`. Don't reimplement search in app code. If you need a new filter, change the RPC signature and bump the search action.

### Updating types

The repo does **not** commit generated DB types. Run if you want them locally:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

Then ignore the file (it's not currently in `.gitignore` but it's also not tracked — keep it that way).

## 9. The MCP server (local)

The local Claude Code config in `.mcp.json` is **gitignored** — feel free to point it at `https://prompt-repo-iota.vercel.app/api/mcp` (production) or `http://localhost:3000/api/mcp` (local), with an `x-api-key` from `/profile`. The plaintext key in your local `.mcp.json` is yours to manage; it never lives on the server (only its SHA-256 hash does).

Some practical notes:

- For the `my-prompts` server to authenticate locally, the SHA-256 of the plaintext API key must exist in `user_api_keys.key_hash` for the corresponding user. Easiest path: sign up locally → `/profile` → create key → paste the plaintext into your local `.mcp.json`.
- The dispatcher requires a `tools/call` envelope (per the MCP standard). `prompts/list`, `prompts/get`, etc. are kept as legacy aliases (see `src/features/mcp/dispatcher.ts`).

## 10. Branch strategy

- **`main`** — production. CI runs on push/PR to this branch.
- **`develop`** — default integration branch. Feature branches merge here first.
- **Feature branches** — branch off `develop`, name `feature/<short-description>` (current convention; check existing branches to confirm before naming).

> ⚠ **CI gap:** `.github/workflows/ci.yml` only runs on `push`/`pull_request` to **`main`**. Pushes and PRs targeting `develop` do **not** currently trigger CI. If you want lint/test gates on `develop`, expand the `branches` list in the workflow.

## 11. Common debugging entry points

| Symptom | First place to look |
|---------|---------------------|
| Auth redirect loop | `src/lib/supabase/middleware.ts` (matcher excludes + redirect targets) |
| MCP request unauthorized | `src/lib/api-keys/verify.ts` + check `user_api_keys.key_hash` matches SHA-256 of plaintext |
| Public sharing link broken | `prompts.is_public` flag + RLS policy on `prompts` |
| Search returns nothing | `update_prompt_search_tokens_trigger` triggers, then the `search_prompts` RPC behaviour for empty/whitespace queries |
| AI provider 401/timeout | `src/features/ai-composer/actions.ts` translates these into user-friendly errors; check `user_ai_providers.encrypted_api_key` and the `pgp_sym_decrypt_text` RPC |
| New version not appearing | Confirm `prompt_versions` row inserted (no UPDATE/DELETE policy → append-only); the "latest" is computed by `get_latest_prompt_version_id()` (there is **no** `latest_version_id` column on `prompts`) |

## 12. References inside the repo

- **CLAUDE.md** — terse project guidance for AI agents (commands, architecture overview, MCP config). Read it before starting non-trivial work.
- **`_bmad-output/planning-artifacts/`** — original PRD, architecture, epics, UX spec.
- **`_bmad-output/implementation-artifacts/`** — per-story implementation notes (one file per user story, numbered Epic-Story).
- **`docs/verification/rls-isolation.md`** — the RLS isolation regression-test recipe; run before any change that touches RLS policies.
