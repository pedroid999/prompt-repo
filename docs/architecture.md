# PromptRepo — Architecture

**Status:** Brownfield as-is documentation, generated from a deep code scan on 2026-05-01.
**Scope:** Production system in `main`/`develop` as of this date. The **planning-stage** architecture lives in `_bmad-output/planning-artifacts/architecture.md` — it preserves the original design intent, but several details have drifted (called out in §13).

---

## 1. Executive summary

PromptRepo is a **single-codebase Next.js 15 application** backed by a managed Supabase project. It does three things:

1. **Stores and versions prompts** for an authenticated user, with immutable history, soft-archive, and public link sharing.
2. **Resolves variables** in prompts at request time (with optional point-in-time snapshots) and computes diffs across versions.
3. **Exposes the user's prompt library to AI agents over MCP** (Model Context Protocol) via JSON-RPC 2.0 at `POST /api/mcp`.

The architecture leans hard on three Next.js / Supabase native patterns:

- **Server Components everywhere by default**, with `'use client'` reserved for genuinely interactive surfaces. There is no global client state library.
- **Server Actions for every mutation.** REST endpoints exist only where a protocol mandates HTTP (the MCP JSON-RPC endpoint and the OAuth callback).
- **PostgreSQL Row-Level Security as the authorisation model.** Application code authenticates the user; the database authorises every read and write.

This combination keeps the codebase thin (no controllers, no service layer, no resolvers) and pushes correctness into the schema.

## 2. System context

```
┌─────────────────────────┐      ┌───────────────────────────────┐
│ Browser                 │      │ MCP clients                   │
│ (Next.js client bundle) │      │ (Claude Code, Claude Desktop, │
└──────────┬──────────────┘      │  Cursor, custom agents)       │
           │ HTTPS                └────────────────┬──────────────┘
           │ session cookies                       │ HTTPS
           │                                       │ Authorization: Bearer / x-api-key
           ▼                                       ▼
┌────────────────────────────────────────────────────────────────┐
│  Next.js 15 (Vercel)                                           │
│   • Edge middleware (session refresh, route exemptions)        │
│   • RSC pages + Server Actions (mutation surface)              │
│   • /api/mcp route handler (JSON-RPC 2.0)                      │
│   • /auth/callback (OAuth code exchange)                       │
└──────────┬─────────────────────────────────────────────────────┘
           │
           │ supabase-js (anon role for end-users,
           │              service_role for /api/mcp only)
           ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase (managed PostgreSQL)                                 │
│   • Tables + RLS policies                                      │
│   • Auth (GoTrue) — email/password + OAuth (GitHub, Google)    │
│   • Search RPC (tsvector + weighted FTS)                       │
│   • pgcrypto for AI-provider key encryption                    │
└────────────────────────────────────────────────────────────────┘
```

External AI providers (Anthropic, OpenAI, Google Gemini, Ollama) are called **only from the AI Composer feature**, on behalf of the user, using credentials the user has stored encrypted in `user_ai_providers`. The application is not an AI orchestration tool — those calls are scoped to a single feature.

## 3. Source-of-truth references

Before changing anything, skim these in this order:

| Document | Purpose |
|----------|---------|
| `docs/api-contracts.md` | All HTTP routes + every Server Action signature, group-by-feature |
| `docs/data-models.md` | Schema, RLS policies, FTS triggers, FK invariants |
| `docs/component-inventory.md` | Component territories + state-management rules |
| `docs/source-tree-analysis.md` | What lives where, with annotations |
| `docs/development-guide.md` | Local setup + per-module conventions |
| `docs/deployment-guide.md` | Vercel + Supabase config; CI footprint |
| `docs/verification/rls-isolation.md` | RLS regression-test recipe |
| `_bmad-output/planning-artifacts/` | Original PRD, planning architecture, epics, UX spec |
| `_bmad-output/implementation-artifacts/<epic>-<story>-<slug>.md` | Per-story rationale and trade-offs |
| `CLAUDE.md` | Concise project conventions for AI agents |

## 4. Technology stack

(Summary; see §3 of `docs/source-tree-analysis.md` for the full stack table.)

- **Runtime:** Node.js 20, Next.js 15.5 (App Router, RSC, Server Actions). Vanilla `next.config.ts`.
- **Database:** PostgreSQL via Supabase. Schema in `supabase/migrations/` (10 files, Feb–Mar 2026).
- **Auth:** Supabase GoTrue (email/password + GitHub + Google). SSR session refresh via `@supabase/ssr` middleware.
- **UI:** Tailwind 4 + shadcn `new-york` style on top of Radix primitives. Lucide icons. Sonner toasts. `cmdk` palette.
- **Forms / validation:** `react-hook-form` + Zod v4.
- **State management:** None. (Local React state + Server Action revalidation.)
- **Testing:** Vitest 4 + React Testing Library + jsdom.
- **Lint:** ESLint 9 (flat) extending `next/core-web-vitals` + `next/typescript`.
- **CI:** GitHub Actions (`test` + `build` jobs, on `main` only).
- **Hosting:** Vercel (frontend + serverless functions). Supabase (DB + auth).

## 5. Logical architecture

The codebase organises around **feature modules** under `src/features/<name>/` rather than horizontal layers.

```
src/features/
├── prompts/            # Core CRUD + versioning (the heart of the app)
├── collections/        # User-owned groupings
├── search/             # tsvector-backed FTS via RPC
├── snapshots/          # Point-in-time capture of (version, variables)
├── resolution-engine/  # {{variable}} substitution, JIT form
├── api-keys/           # MCP API-key generation, hashing, revocation
├── ai-providers/       # Per-user AI provider configs (encrypted)
├── ai-composer/        # AI-assisted brainstorm → structured prompt
└── mcp/                # JSON-RPC 2.0 dispatcher + tool handlers
```

Each module owns its **server actions, queries, components, types**, and (where relevant) **schemas, hooks, providers, utils**. Cross-module dependencies are intentional and explicit (e.g. `mcp` queries `prompts` data, `ai-composer` calls `ai-providers` queries to decrypt the user's keys).

**Cross-cutting libraries** live under `src/lib/` and intentionally contain no business logic:

- `supabase/` — three-client factory (browser singleton, server reader, middleware refresher) + `service.ts` for service-role MCP path.
- `api-keys/` — `generateApiKey`, `hashApiKey`, `verifyApiKey`.
- `crypto/` — `encryptApiKey`/`decryptApiKey` (calls Supabase pgcrypto RPCs).
- `validation/` — Zod schemas grouped by domain.
- `utils/` — `cn`, `variable-parser`.

## 6. Request paths (the four shapes)

There are exactly four ways data flows through the system. Recognising which shape you're in tells you where to look when debugging.

### 6.1 Authenticated page render

```
Browser request
  → Middleware (`updateSession` refreshes Supabase cookies)
  → RSC page (e.g. `app/page.tsx`)
       → calls `lib/supabase/server.ts::createClient(cookieStore)`
       → calls feature query (e.g. `features/prompts/queries/get-prompts.ts`)
       → Postgres returns rows authorised by RLS using `auth.uid()`
  → HTML streamed to browser, hydration mounts client components
```

This is the dominant path. Every authenticated UI surface follows it.

### 6.2 Authenticated mutation (Server Action)

```
Client component invokes server action (e.g. `savePrompt(input)`)
  → Action runs on server (`'use server'`)
       → `createClient(cookieStore)` → resolves auth.uid() from cookie
       → Zod `safeParse` against the input schema
       → supabase.<table>.insert/update/delete (RLS enforces ownership)
       → `revalidatePath('/')` invalidates the affected route(s)
  → Client receives `{ success, data | error }` result
  → Next render fetches fresh data via the path-1 flow
```

Notable: there is **no client-side optimistic update**. The pattern is "dispatch action → revalidate → re-render". UI feedback during the wait comes from React's `useFormStatus` or component-local "is submitting" state.

### 6.3 Public sharing read

```
Browser hits `/p/<promptId>`
  → Middleware (matcher does NOT redirect /p to /auth/login)
  → RSC page reads with anon Supabase client
       → RLS policy allows SELECT when `prompts.is_public = true`
  → Read-only HTML rendered without session
```

### 6.4 MCP API call

```
MCP client POSTs JSON-RPC envelope to `/api/mcp`
  with Authorization: Bearer <key> or x-api-key: <key>
  → Route handler (`app/api/mcp/route.ts`) — no session middleware redirect
       → `verifyApiKey(rawKey)` (SHA-256 lookup against `user_api_keys.key_hash`)
       → Validates JSON-RPC envelope via `mcpRequestSchema`
       → `dispatch(request, userId)` (`features/mcp/dispatcher.ts`)
            → service-role Supabase client (bypasses RLS)
            → handler scopes by `user_id = userId OR is_public = true`
       → JSON-RPC 2.0 response
  → Always HTTP 200 (errors live inside the envelope)
```

This path is the only place the **service-role** key is used. The trade-off: the dispatcher must explicitly filter by `userId` in every tool handler. That invariant is the regression risk and is covered by `docs/verification/rls-isolation.md`.

## 7. Authorisation model

PostgreSQL Row-Level Security is the source of truth. Application code never makes its own ACL decisions — it presents the user identity (or doesn't), and the database decides.

| Identity | Carrier | Database role | Authorisation |
|----------|---------|---------------|----------------|
| Authenticated user (UI) | Supabase session cookie | `authenticated` | RLS policy `auth.uid() = user_id` per table |
| Anonymous (public link viewer) | No session | `anon` | Only `prompts` rows with `is_public = true` are visible |
| Authenticated MCP caller | API key → SHA-256 lookup → `userId` | `service_role` (RLS bypassed) | Tool handlers explicitly filter `WHERE user_id = userId OR is_public = true` |
| Anonymous MCP caller | No header | `service_role` (RLS bypassed) | Tool handlers filter `WHERE is_public = true` only |

The `prompt_versions` table has **no UPDATE or DELETE policy** anywhere — it's append-only by design. A "restore" operation creates a new version cloning a historical content payload; it never overwrites.

## 8. Data architecture

(Summary — see `docs/data-models.md` for the full schema, RLS, and migration timeline.)

The schema centres on a **two-table versioning** pattern:

- **`prompts`** — HEAD state: title, description, owner, lifecycle flags (`archived_at`, `is_public`), and the `search_tokens` tsvector.
- **`prompt_versions`** — Append-only history: one row per save, ordered by `version_number`. The "latest" version is computed at query time by `get_latest_prompt_version_id()` / `get_latest_prompt_content()` SQL functions.

Surrounding tables:

- **`profiles`** — 1:1 with `auth.users`, auto-provisioned by a trigger.
- **`collections`** + **`collection_prompts`** — user-owned groupings (N:M).
- **`prompt_snapshots`** — point-in-time `(prompt_version_id, variables JSONB)` captures.
- **`user_api_keys`** — MCP bearer auth; stores SHA-256 hash only.
- **`user_ai_providers`** — per-provider config; cloud keys encrypted via pgcrypto.

Search is implemented entirely in the database: a weighted `tsvector` (title=A, description=B, content=C), a GIN index, and a `search_prompts(...)` RPC with prefix matching (`lexeme:*`) and filters for owner, collection, and archive state. The application never builds tsqueries by hand.

## 9. Authentication & session lifecycle

1. **Sign-up / sign-in** — Server Actions in `app/auth/actions.ts` call Supabase Auth. OAuth flows redirect to `/auth/callback?code=…&next=…`.
2. **Code exchange** — `app/auth/callback/route.ts` exchanges the code for a session, validates `next` is same-origin (open-redirect guard), and redirects.
3. **Session refresh** — `src/middleware.ts` runs on every non-static request, calling `lib/supabase/middleware.ts::updateSession`. This refreshes the access token cookie if it's expired and **redirects unauthenticated users to `/auth/login`**, with explicit exemptions for `/auth/*`, `/p/*`, `/api/mcp`, and static assets.
4. **Sign-up trigger** — `handle_new_user` (DB trigger, `SECURITY DEFINER`) creates a `profiles` row when a `auth.users` row is inserted.

## 10. The MCP server (Module Context Protocol)

A first-class part of the product, not a side feature.

- **Endpoint:** `POST /api/mcp` (JSON-RPC 2.0 over HTTP, CORS-enabled, always HTTP 200).
- **Auth:** API key via `Authorization: Bearer …` (preferred) or `x-api-key: …` (fallback). Anonymous → public prompts only.
- **Methods:** `initialize`, `tools/list`, `tools/call` (standard MCP) + legacy `prompts/{list,get,resolve,search}` aliases.
- **Tools:** `list_prompts`, `get_prompt`, `resolve_prompt`, `search_prompts` — discoverable via `tools/list` with JSON Schema `inputSchema` per tool.
- **Errors:** Standard JSON-RPC codes (`-32700`…`-32603`) plus app-level `-32001 INVALID_API_KEY` and `-32002 PROMPT_NOT_FOUND`.
- **Implementation:** route handler delegates to `features/mcp/dispatcher.ts`, which routes by method to `features/mcp/tools/*.ts`. Each handler accepts `(params, userId, supabase)` and returns plain JSON; the `tools/call` adapter wraps results into the MCP `{ content: [{ type:'text', text: …}] }` shape.

The MCP path is the only place that:
- uses the Supabase **service-role** client.
- relies on **explicit `userId` filtering in application code** instead of RLS.
- bypasses the session-redirect middleware.

This is the most security-sensitive code in the repo. Every MCP tool change must preserve the invariant "filter by `userId OR is_public = true`" — and `docs/verification/rls-isolation.md` is the regression-test recipe.

## 11. Frontend architecture

(Summary — see `docs/component-inventory.md` for the full inventory and territorial split.)

- **Three component territories:** atomic `components/ui/` (shadcn), cross-feature `components/{shared,features}/`, feature-local `features/<name>/components/`.
- **Forms:** RHF + Zod via the shadcn `Form` primitive (the only file in the codebase that uses `createContext`).
- **Theme:** dark-mode-only Kanagawa palette, hex colours hardcoded for brand surfaces. `next-themes` is installed but not wired up yet.
- **State management:** none — local `useState` only, no global store, no `useReducer`. Mutations via Server Actions + `revalidatePath`.
- **Keyboard shortcuts:** `Cmd+K` global palette, arrow nav in the prompt list, `Ctrl+C/V` in the editor.
- **Responsive target:** ~400 px width minimum (the "sidecar" use case), with `md:` breakpoints widening the layout.

## 12. Cross-cutting concerns

### Validation

Zod v4 schemas are **mostly** centralised under `src/lib/validation/*.ts`. Exceptions: `features/collections/schemas.ts` and an inline schema in `save-new-version.ts`. Both styles are present; either is acceptable, but prefer `lib/validation/` for anything reused.

### Error handling

- **Server Actions** return discriminated unions `{ success, data | error }`. Errors are user-facing strings — they should never leak DB error codes verbatim. The exception is `collections/actions.ts`, which surfaces `error.message` directly (legacy pattern; don't replicate).
- **`/api/mcp`** never throws to the client. The dispatcher catches everything, logs unknown errors via `console.error`, and returns `INTERNAL_ERROR`. Known errors (thrown by tool handlers as `{ code, message }`) are returned with their original code.
- **AI Composer** translates HTTP failures from external providers into user-friendly strings (timeout, 401/403, 429, ECONNREFUSED).

### Caching

The only caching layer is Next.js's per-route cache, invalidated via `revalidatePath`. There is no Redis, no `unstable_cache` use, no `revalidateTag`. If you reach for caching, lift the pattern from this constraint deliberately.

### Secrets & encryption

- **Supabase service-role key** lives in `SUPABASE_SERVICE_ROLE_KEY`, used only by `lib/supabase/service.ts` (which imports `server-only`). The MCP route is the sole consumer.
- **MCP API keys** are generated client-side via `crypto.randomUUID`-style randomness in `lib/api-keys/hash.ts`, returned to the user once, and persisted only as SHA-256 hashes.
- **AI provider keys** are encrypted by Postgres via `pgp_sym_encrypt_text` (declared `SECURITY DEFINER`, search_path locked). The application calls these via `supabase.rpc(...)`, so the plaintext key never travels unencrypted past the TLS connection to Supabase.
- **OAuth client secrets** live in env vars; configured in Supabase Auth → Providers in production.

### Testing strategy

- **Unit** for utilities, validation schemas, hashing/encryption, the MCP dispatcher and tools, the search action, the variable parser, and key components.
- **Integration** is implicit — Server Actions run against a real Supabase locally during dev. There is no in-tree integration suite that talks to the database.
- **Verification** lives in `docs/verification/` (currently only `rls-isolation.md`). Run before any change that modifies RLS or the service-role path.
- **CI** runs `npm test -- --run` and `npm run lint` on `main`. There is no E2E test suite (Playwright is referenced via the `.mcp.json` MCP server entry but not used in tests).

### Observability

- Server actions and `/api/mcp` use `console.error` for unexpected failures. These surface in Vercel Function logs.
- No Sentry / OpenTelemetry / structured logging is wired up.
- Supabase Logs Explorer is the source of truth for DB / auth events.

## 13. Drift from the planning architecture (read this before the planning doc)

These are differences between the as-built state and `_bmad-output/planning-artifacts/architecture.md` / `CLAUDE.md`:

| Area | Planning doc says | Actual code is | Action |
|------|------------------|----------------|--------|
| Prompt HEAD pointer | `prompts.latest_version_id` FK to `prompt_versions(id)` | **No such column.** Latest version is computed via `get_latest_prompt_version_id()` SQL function and `ORDER BY version_number DESC LIMIT 1`. | Don't rely on a `latest_version_id` field. Use the SQL helpers or the explicit ordering. |
| FK targets | All user-owned tables FK to `auth.users` | `prompts.user_id` → `profiles(id)`; everything else → `auth.users(id)` | Functionally equivalent (profiles 1:1 mirrors auth.users via the signup trigger), but the cascade chain for `prompts` is two hops. Aware-of, not actionable. |
| State management | "Two-Table Versioning + Server Actions" (no client store mentioned) | Confirmed: no global store, no useReducer | None — planning matches code. |
| CI | Not mentioned in planning artifacts | `.github/workflows/ci.yml` runs lint+test+build on `main` only (`develop` not gated) | Optional fix: add `develop` to triggers. |

If you find another drift, log it here — that's how this document stays accurate.

## 14. Known gaps and open trade-offs

These are deliberate today but worth re-evaluating when scope grows:

- **Manual schema migration.** `supabase db push` is run from a developer machine. Fine for solo / small team; risky beyond that.
- **Server Action result shapes are inconsistent.** Newer modules use `{ success, data | error }`; `collections` uses `{ data, error }`; auth uses `redirect(...)`. New code should use the discriminated-union shape.
- **Manual rollback in two-table mutations.** `savePrompt` and `duplicatePrompt` insert into `prompts`, then into `prompt_versions`, and manually delete the prompt if the version insert fails. This belongs in a Postgres function or a transactional RPC. Currently a known footgun.
- **No staging Supabase project.** Vercel previews talk to the same Supabase project as production. Any destructive action in a preview hits production data.
- **No E2E test layer.** The MCP regression risk in particular (the service-role path) is covered only by unit tests of individual tool handlers.
- **`develop` branch has no CI gate.** Push/PR to `develop` is not lint/test gated.
- **`SUPABASE_SERVICE_ROLE_KEY` is not provided to the CI build job.** Currently fine because `service.ts` reads it lazily; will become a build failure if any RSC starts importing `service.ts` at module scope.
- **Light-mode theme.** `next-themes` is installed; root `<html className="dark">` is hardcoded; no toggle yet.

## 15. Where to make common changes

| Change | Touch this first |
|--------|------------------|
| Add a column to `prompts` | New SQL migration → update RLS if relevant → update `features/prompts/types/index.ts` → update `features/prompts/queries/*` → update components |
| Add a new feature module | `src/features/<name>/` mirroring the existing module shape; add a Zod schema to `src/lib/validation/<name>.ts`; wire its components into a page or the layout |
| Add a new MCP tool | `features/mcp/tools/<tool>.ts` → register in `features/mcp/tools/index.ts` → add to `TOOL_HANDLER_MAP` and the catalogue in `list-tools.ts`; update `docs/api-contracts.md` |
| Add an OAuth provider | Supabase Auth → Providers (config) → add a new server action in `app/auth/actions.ts` → expose a button in `app/auth/login/page.tsx` |
| Add an AI provider | New file in `features/ai-composer/providers/<name>.ts` implementing the adapter contract → register in `factory.ts` → update `provider` enum in the DB CHECK constraint and the Zod schema |
| Add a Postgres function | New migration. Always declare STABLE/IMMUTABLE/VOLATILE explicitly. Lock down search_path on SECURITY DEFINER functions. |
| Add a new shadcn primitive | `npx shadcn add <component>` — it lands in `src/components/ui/` automatically |
