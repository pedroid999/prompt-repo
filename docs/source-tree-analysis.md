# Source Tree Analysis

Annotated tour of the repository. Read this once before touching the codebase — it'll save you guesses.

## Top level

```
prompt-repo/
├── src/                       # Application source (every change you make lives here)
├── supabase/                  # Local Supabase config + SQL migrations
├── public/                    # Static assets served at /
├── docs/                      # ← THIS DIRECTORY: brownfield documentation
├── _bmad/                     # BMAD method assets (workflows, configs, templates)
├── _bmad-output/              # Planning + per-story implementation artifacts
├── .claude/                   # Claude Code agent commands (BMAD-generated)
├── CLAUDE.md                  # Project guidance for Claude Code
├── GEMINI.md                  # Companion guidance for Gemini agents
├── README.md                  # Public-facing project introduction
├── package.json               # Single Node manifest (no workspaces)
├── tsconfig.json              # @/* alias to ./src/*
├── next.config.ts             # Vanilla — no custom Next.js config
├── eslint.config.mjs          # Flat ESLint extending next/core-web-vitals + next/typescript
├── postcss.config.mjs         # Tailwind 4 PostCSS plugin
├── vitest.config.ts           # Vitest 4 + jsdom + @vitejs/plugin-react
├── vitest.setup.ts            # @testing-library/jest-dom global matchers
├── components.json            # shadcn config (style=new-york, base=zinc, lucide icons)
└── .mcp.json                  # Local MCP server registration for Claude Code
```

Skip directories: `node_modules/`, `.next/`, `.git/`, `.idea/`, `tmp/`, `.playwright-mcp/`. They're either generated, IDE-specific, or runtime caches.

## `src/` — application code

```
src/
├── middleware.ts              # Next.js middleware → delegates to lib/supabase/middleware.updateSession
├── middleware.test.ts         # Tests for the matcher and session refresh path
│
├── app/                       # ── App Router (routes, layouts, route handlers) ───────────
│   ├── layout.tsx             # Root layout: dark theme hardcoded, sidebar with CollectionList,
│   │                          #   global CommandPalette + Toaster
│   ├── page.tsx               # /  — home / prompt list (Server Component)
│   ├── globals.css            # Tailwind 4 entry + theme tokens
│   ├── favicon.ico
│   ├── layout-metadata.test.ts
│   │
│   ├── api/                   # ── HTTP route handlers (the only "REST" surface) ──────────
│   │   └── mcp/route.ts       # POST /api/mcp + OPTIONS — JSON-RPC 2.0 dispatcher (api key auth)
│   │
│   ├── auth/                  # ── Auth flows ──────────────────────────────────────────────
│   │   ├── actions.ts         # signInWithGithub/Google/Email, signUpWithEmail, signOut (Server Actions)
│   │   ├── auth-error/page.tsx
│   │   ├── callback/route.ts  # GET /auth/callback?code=…&next=… — exchangeCodeForSession + safe redirect
│   │   └── login/page.tsx
│   │
│   ├── p/                     # ── Public read-only sharing ───────────────────────────────
│   │   └── [promptId]/page.tsx  # /p/[promptId] — anonymous-readable when prompts.is_public = true
│   │                            #                  EXCLUDED from the session-redirect middleware path
│   │
│   ├── profile/               # ── Profile + API keys + AI provider settings ─────────────
│   │   ├── actions.ts         # getProfile, updateProfile (Server Actions)
│   │   └── page.tsx
│   │
│   └── prompts/
│       └── create/page.tsx    # /prompts/create — Create-prompt form
│
├── components/                # ── UI components (territory split, see component-inventory.md) ─
│   ├── ui/                    # shadcn primitives (button, dialog, form, command, …)
│   ├── shared/                # Cross-feature plain components (back-button, auth/submit-button)
│   └── features/              # Cross-feature composed components, mounted at the app shell
│       ├── navigation/        #   mobile-nav.tsx
│       ├── profile/           #   api-keys-card, profile-form, mcp-config-card, ai-providers-card
│       └── search/            #   command-palette (Cmd+K), search-bar
│
├── features/                  # ── Domain modules (the architectural backbone of the app) ─
│   ├── prompts/               #   Core prompt CRUD + versioning
│   │   ├── actions/           #     save-prompt, save-new-version, restore-version, manage-prompt,
│   │   │                      #     duplicate-prompt
│   │   ├── queries/           #     get-prompts, get-prompt-history, get-public-prompt
│   │   ├── components/        #     prompts-container, prompt-list, prompt-detail, prompt-history,
│   │   │                      #     create-prompt-form, diff-viewer
│   │   ├── types/index.ts     #     PromptWithLatestVersion, PromptVersion, etc.
│   │   └── utils/diff.ts      #     wrapper around `diff` library for line/word diffing
│   │
│   ├── collections/           #   User-owned groupings (sidebar collections)
│   │   ├── actions.ts         #     create/update/delete collection, add/removeFromCollection
│   │   ├── components/        #     collection-list (server component)
│   │   ├── schemas.ts         #     createCollectionSchema (co-located, not in lib/validation)
│   │   └── types.ts
│   │
│   ├── search/                #   Full-text search via Postgres tsvector + RPC
│   │   ├── actions.ts         #     searchPrompts → supabase.rpc('search_prompts', …)
│   │   └── types.ts
│   │
│   ├── snapshots/             #   Point-in-time prompt-version + variable bindings
│   │   ├── actions.ts         #     saveSnapshot
│   │   ├── queries.ts         #     getSnapshotsForPromptVersion, hydrate
│   │   ├── components/        #     snapshot-list, save-snapshot-dialog
│   │   └── types/index.ts
│   │
│   ├── resolution-engine/     #   Variable substitution {{name}} → value
│   │   ├── components/        #     resolution-form (JIT dynamic form)
│   │   ├── hooks/             #     (uses local hooks for live re-rendering)
│   │   ├── utils/hydration.ts #     hydrateVariables, parsing
│   │   └── types/
│   │
│   ├── api-keys/              #   User-managed MCP API keys
│   │   ├── actions.ts         #     createApiKey, listApiKeys, revokeApiKey
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── ai-providers/          #   Per-user provider configurations (claude/openai/gemini/ollama)
│   │   ├── actions.ts         #     saveProvider, deleteProvider, toggleProvider
│   │   ├── queries.ts         #     getProviderConfig (decrypts), getProviderDisplayList
│   │   └── types.ts
│   │
│   ├── ai-composer/           #   AI-assisted brainstorm → structured prompt
│   │   ├── actions.ts         #     structurePrompt, listOllamaModels
│   │   ├── components/        #     composer-editor, composer-toolbar, diff-dialog
│   │   ├── hooks/             #     use-composer (the orchestrator hook)
│   │   ├── providers/         #     adapters: claude.ts, openai.ts, gemini.ts, ollama.ts + factory + constants
│   │   └── types.ts
│   │
│   └── mcp/                   #   Model Context Protocol server (consumed by /api/mcp)
│       ├── dispatcher.ts      #     JSON-RPC 2.0 dispatcher with method → handler map
│       ├── tools/             #     initialize, list-tools, list-prompts, get-prompt,
│       │                      #     resolve-prompt, search-prompts
│       ├── types.ts           #     MCPRequest/Response, MCP_ERROR_CODES
│       └── index.ts
│
└── lib/                       # ── Cross-cutting libraries (no business logic) ───────────
    ├── supabase/              #   Three-client pattern + a service-role client
    │   ├── client.ts          #     Browser singleton (createBrowserClient)
    │   ├── server.ts          #     Server Component / Action client (createServerClient + cookieStore)
    │   ├── middleware.ts      #     Session-refresh + redirect logic (exempts /api/mcp and /p)
    │   └── service.ts         #     Service-role client (bypasses RLS) — used only by MCP dispatcher
    │
    ├── api-keys/              #   API key generation, hashing, verification
    │   ├── hash.ts            #     generateApiKey + hashApiKey (SHA-256)
    │   └── verify.ts          #     verifyApiKey (called by /api/mcp on every request)
    │
    ├── crypto/                #   Provider-key encryption (pgcrypto via Supabase RPCs)
    │   └── provider-keys.ts   #     encryptApiKey / decryptApiKey
    │
    ├── utils/                 #   Cross-cutting helpers
    │   ├── cn.ts              #     clsx + tailwind-merge
    │   ├── variable-parser.ts #     Extracts {{var}} placeholders from prompt content
    │   └── index.ts
    │
    └── validation/            #   Zod v4 schemas — centralised
        ├── prompt.ts          #     promptCreateSchema, promptMetadataSchema
        ├── snapshot.ts        #     snapshotSchema
        ├── profile.ts         #     profileSchema
        ├── api-keys.ts        #     createApiKeySchema
        ├── ai-providers.ts    #     saveProviderSchema, deleteProviderSchema, toggleProviderSchema
        ├── ai-composer.ts     #     structureRequestSchema
        └── mcp.ts             #     mcpRequestSchema (JSON-RPC envelope)
```

## `supabase/` — local Supabase configuration

```
supabase/
├── config.toml          # Local Supabase ports, auth providers, email templates, etc.
├── .gitignore
├── .branches/           # Local branch state (ignored)
├── .temp/               # Local cache (ignored)
├── snippets/            # Saved SQL editor snippets
└── migrations/          # ← The source of truth for the schema
    ├── 20260208000000_init_foundation.sql
    ├── 20260208000001_prompt_schema.sql
    ├── 20260208000002_search_index.sql
    ├── 20260208000003_collections.sql
    ├── 20260208000004_prompt_snapshots.sql
    ├── 20260208000005_update_search_rpc.sql
    ├── 20260226000006_prompt_lifecycle_archive.sql
    ├── 20260227000007_prompt_public_sharing.sql
    ├── 20260301000008_user_api_keys.sql
    └── 20260314000009_user_ai_providers.sql
```

Apply the entire schema locally with `npx supabase db reset`.

## `_bmad-output/` — planning + implementation artifacts

```
_bmad-output/
├── planning-artifacts/                          # Created during the planning phase
│   ├── product-brief-prompt-repo-2026-02-07.md
│   ├── prd.md                                   # Product Requirements Document
│   ├── prd-validation-report.md
│   ├── architecture.md                          # Planning-stage architecture (some drift from current code)
│   ├── ux-design-specification.md
│   ├── ux-design-directions.html
│   ├── epics.md                                 # 6 epics, ~24 stories
│   ├── implementation-readiness-report-2026-02-08.md
│   ├── implementation-readiness-report-2026-02-11.md
│   └── validation-report-2026-02-11.md
│
└── implementation-artifacts/                    # One file per story implemented
    ├── 1-1-project-initialization-foundation.md
    ├── 1-2-database-foundation-multi-tenant-rls.md
    ├── 1-3-secure-authentication-oauth-email.md
    ├── 1-4-user-profile-management.md
    ├── 2-1-prompt-database-schema-two-table-pattern.md
    ├── 2-2-create-versioned-save-logic.md
    ├── 2-3-prompt-list-detail-view.md
    ├── 2-4-version-history-restoration.md
    ├── 3-1-variable-detection-regex-parser.md
    ├── 3-2-dynamic-resolution-form-just-in-time-ui.md
    ├── 3-3-real-time-resolved-preview.md
    ├── 3-4-one-click-copy-clipboard-feedback.md
    ├── 4-1-high-performance-full-text-search.md
    ├── 4-2-global-command-palette-cmd-k.md
    ├── 4-3-collections-management.md
    ├── 4-4-ui-density-sidebar-resilience.md
    ├── 5-1-snapshot-database-schema-rls.md
    ├── 5-2-save-snapshot-listing.md
    ├── 5-3-snapshot-re-resolution-hydration.md
    ├── 5-4-visual-diff-engine-ui.md
    ├── 6-1-prompt-lifecycle-management.md
    ├── epic-4-retro-2026-02-11.md
    ├── final-validation-report.md
    ├── sprint-status.yaml
    └── tests/test-summary.md
```

These are valuable history. They explain **why** decisions were made — read the relevant story file before changing a feature module.

## Critical entry points

| Entry point | File | Type |
|-------------|------|------|
| Next.js HTTP entry | `src/app/layout.tsx` | RSC root layout |
| Edge middleware | `src/middleware.ts` | matches all paths except static assets, calls `updateSession` |
| Auth flow | `src/app/auth/{login/page.tsx, actions.ts, callback/route.ts}` | OAuth + email |
| MCP server | `src/app/api/mcp/route.ts` → `src/features/mcp/dispatcher.ts` | JSON-RPC 2.0 |
| Prompt list page | `src/app/page.tsx` → `src/features/prompts/queries/get-prompts.ts` | RSC |
| Public sharing | `src/app/p/[promptId]/page.tsx` | RSC, anon allowed |
| Local DB schema | `supabase/migrations/*.sql` | applied via `npx supabase db reset` |

## Naming and convention conventions

- **Path alias `@/*`** maps to `./src/*` — always import via `@/...`, never relative paths across module boundaries.
- **Feature modules** under `src/features/<name>/` co-locate `actions.ts`, `queries.ts`, `components/`, `types.ts` (or `types/index.ts`), and optional `hooks/`, `utils/`, `providers/`, `schemas.ts`.
- **Tests** live next to the file under test (`*.test.ts`/`*.test.tsx`). Vitest discovers them via the include pattern `**/*.{test,spec}.{ts,tsx}`.
- **Server Actions** use `'use server'` directive and live in `actions.ts` or `app/<route>/actions.ts`.
- **Server-only modules** import `server-only` (devDependency, listed in package.json) to break the build if accidentally imported into a client bundle.
- **Validation schemas** prefer the centralised `src/lib/validation/*.ts` location. Some feature modules (collections, save-new-version) have inline or co-located schemas — both styles are present in the codebase.
