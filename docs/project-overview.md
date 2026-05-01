# Project Overview — PromptRepo

> **PromptRepo** is a high-performance, version-controlled prompt manager that doubles as an MCP server for AI agents. It runs as a single Next.js 15 application on Vercel, backed by managed Supabase Postgres + Auth.

## What it does

PromptRepo treats prompts the way developers treat code: every save creates an immutable version, every prompt can be parameterised with `{{variables}}`, and every snapshot can be re-hydrated later. Authenticated users get private prompts with full history; selected prompts can be made publicly readable via short links; and AI agents can pull or resolve prompts directly through the MCP server endpoint.

Core value props (from the original PRD):

- **Sub-100 ms full-text search** across the user's library (Postgres `tsvector` + GIN).
- **Just-in-time variable form generation** when viewing a prompt with placeholders.
- **Real-time resolved preview** under 16 ms (60 fps target).
- **Strict multi-tenancy** enforced by PostgreSQL Row-Level Security.
- **400 px-wide UI** so the app works as a sidebar / sidecar next to whatever you're really working in.
- **MCP server export** so Claude Code, Claude Desktop, Cursor, and any MCP-compatible agent can consume the library at runtime — no copy-paste.

## Repository at a glance

| Field | Value |
|-------|-------|
| Repository type | **Monolith** (single `package.json`, no workspaces) |
| Project type | Web (Next.js App Router) |
| Primary language | TypeScript (strict, target ES2017) |
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| UI | Tailwind CSS 4 + shadcn/ui (`new-york` style, Kanagawa palette) |
| Database / Auth | Supabase (PostgreSQL + GoTrue + RLS) |
| Hosting | Vercel + Supabase managed project |
| Tests | Vitest 4 + React Testing Library + jsdom |
| CI | GitHub Actions (lint + test + build, **`main` only**) |
| Default branch | `develop` (PRs merge here first; `main` is production) |
| Deployment URL | `https://prompt-repo-iota.vercel.app` |

## Tech stack summary

| Category | Technology | Notes |
|----------|------------|-------|
| **Framework** | Next.js 15.5 | App Router, RSC, Server Actions. No custom `next.config.ts`. |
| **Database** | PostgreSQL via Supabase | 10 migrations, schema in `supabase/migrations/` |
| **Auth** | Supabase GoTrue | Email/password + GitHub + Google OAuth |
| **Search** | Postgres `tsvector` + weighted FTS | Title=A, description=B, content=C; prefix matching with `:*` |
| **Encryption (AI keys)** | `pgcrypto` via SECURITY DEFINER RPCs | Plaintext keys never leave Supabase TLS |
| **MCP server** | JSON-RPC 2.0 at `POST /api/mcp` | API-key bearer auth (SHA-256 hashed) |
| **State management** | None | Local React state + Server Actions + `revalidatePath` |
| **Forms** | `react-hook-form` + Zod v4 | Schemas in `src/lib/validation/*` |
| **Theme** | Kanagawa (dark only) | Hex colours hardcoded; `next-themes` installed but not toggled |
| **Keyboard** | `cmdk` palette + arrow nav + Ctrl+C/V | Part of the product spec |

## Architecture style

- **Three architectural patterns at once** — and they reinforce each other:
  1. **App Router + Server Components by default**, `'use client'` only at interactive leaves.
  2. **Server Actions for every mutation** (no controllers, no API routes for write paths).
  3. **PostgreSQL RLS as the authorisation layer** (the database is the source of truth for "who can do what").
- **Feature-modular** — `src/features/<name>/` co-locates actions, queries, components, types, schemas, hooks. There are nine feature modules: `prompts`, `collections`, `search`, `snapshots`, `resolution-engine`, `api-keys`, `ai-providers`, `ai-composer`, `mcp`.
- **Two-table prompt versioning** — `prompts` holds HEAD state + lifecycle flags; `prompt_versions` is append-only history. There is **no `latest_version_id` pointer column** despite what the planning architecture suggested — the latest is computed by SQL functions.
- **MCP is a first-class entry point**, not a side feature. It's the only place the Supabase service-role client is used and the only place `userId` filtering lives in application code instead of RLS.

## What lives where

```
src/
├── app/                # App Router (pages, layouts, /api/mcp, /auth/callback)
├── components/
│   ├── ui/             # shadcn primitives
│   ├── shared/         # Cross-feature plain components
│   └── features/       # Cross-feature composed components (search, profile, navigation)
├── features/           # Domain modules (the architectural backbone)
│   ├── prompts/        # CRUD + versioning
│   ├── collections/    # User-owned groupings
│   ├── search/         # tsvector FTS via RPC
│   ├── snapshots/      # Point-in-time captures
│   ├── resolution-engine/   # {{variable}} substitution
│   ├── api-keys/       # MCP API key management
│   ├── ai-providers/   # Per-user AI provider configs (encrypted)
│   ├── ai-composer/    # AI-assisted brainstorm → structured prompt
│   └── mcp/            # JSON-RPC 2.0 dispatcher + tools
└── lib/
    ├── supabase/       # Three-client factory + service-role client
    ├── api-keys/       # Generate / hash / verify
    ├── crypto/         # pgcrypto wrappers
    ├── utils/          # cn, variable-parser
    └── validation/     # Zod schemas

supabase/migrations/    # SQL schema (idempotent, applied with `npx supabase db reset`)
public/                 # Static assets
docs/                   # ← Brownfield documentation (this directory)
_bmad-output/           # Planning + per-story implementation artifacts
```

See `docs/source-tree-analysis.md` for the full annotated tree.

## How to dive in

| If you're… | Read this first |
|------------|-----------------|
| Onboarding to the codebase | `docs/development-guide.md` → `docs/architecture.md` → CLAUDE.md |
| Adding a new feature module | `docs/source-tree-analysis.md` (§ "Naming conventions") + `docs/architecture.md` (§ 15 "Where to make common changes") |
| Touching the database schema | `docs/data-models.md` + `docs/development-guide.md` (§ 8 "Working with the database") |
| Touching the MCP server | `docs/api-contracts.md` (§ 3) + `docs/architecture.md` (§ 10) + `docs/verification/rls-isolation.md` |
| Deploying or debugging prod | `docs/deployment-guide.md` |
| Understanding a feature's history | `_bmad-output/implementation-artifacts/<epic>-<story>-<slug>.md` |

## Original product context

The project was built using **Spec-Driven Development (SDD)** on the BMAD method: a structured pipeline (explore → propose → spec → design → tasks → implement → verify → archive) with planning artifacts preserved verbatim in `_bmad-output/planning-artifacts/`:

- **Product brief** (`product-brief-prompt-repo-2026-02-07.md`) — the original framing and constraints.
- **PRD** (`prd.md`) — functional and non-functional requirements (FR1–FR16, NFR1–NFR9).
- **Architecture** (`architecture.md`) — the planning-stage architecture document. Some details have drifted (see `docs/architecture.md` § 13).
- **UX spec** (`ux-design-specification.md`) — the interaction design.
- **Epics + stories** (`epics.md`) — six epics, ~24 stories, mapped 1:1 to the implementation files in `_bmad-output/implementation-artifacts/`.

## Status

- All six planned epics are implemented (last validation report: `_bmad-output/planning-artifacts/validation-report-2026-02-11.md`).
- Two post-PRD additions live in the codebase: **public sharing links** and the **MCP server export** (Anthropic, OpenAI, Gemini, Ollama provider adapters).
- Active development continues on `develop`; `main` deploys to production.

## License

MIT (see `LICENSE`).
