# PromptRepo — Documentation Index

> Brownfield documentation generated on **2026-05-01** from a deep code scan of `develop` (commit `9d1afac`).
> Re-generate with `/bmad-bmm-document-project` (BMM document-project workflow).

This index is the canonical entry point for AI agents and humans alike. Start here — every other file is one click away.

---

## Project Overview

| Field | Value |
|-------|-------|
| **Type** | Monolith — single Next.js 15 web application |
| **Primary Language** | TypeScript (strict) |
| **Framework** | Next.js 15 (App Router, RSC, Server Actions) |
| **Database / Auth** | Supabase (PostgreSQL + RLS + GoTrue) |
| **Hosting** | Vercel + Supabase managed project |
| **Repository root** | `/Users/pedro.nieto/Documents/spec-driven-dev/repos/prompt-repo` |
| **Default branch** | `develop` (production: `main`) |
| **Live URL** | `https://prompt-repo-iota.vercel.app` |

## Quick Reference

- **Tech stack:** Next.js 15 · React 18 · TypeScript 5 · Tailwind 4 · shadcn/ui (`new-york`/zinc) · Supabase · Zod v4 · Vitest 4
- **Architecture style:** Server Components first, Server Actions for mutations, RLS for authorisation, feature-modular code under `src/features/<name>/`
- **State management:** **None** — local React state only; Server Actions + `revalidatePath` drive updates
- **Entry points:** `src/app/layout.tsx` (root) · `src/middleware.ts` (session refresh) · `src/app/api/mcp/route.ts` (JSON-RPC MCP server)
- **Schema source of truth:** `supabase/migrations/*.sql` (10 migrations, Feb–Mar 2026)

## Generated Documentation

These files were just produced by the scan. They reflect the **as-is** state of the code on the date above.

- [Project Overview](./project-overview.md) — the 60-second pitch + repository facts + tech stack table.
- [Architecture](./architecture.md) — comprehensive technical architecture: request paths, authorisation model, MCP design, drift from planning, known gaps.
- [Source Tree Analysis](./source-tree-analysis.md) — annotated directory tree, naming conventions, where to find things.
- [Component Inventory](./component-inventory.md) — three component territories, primitives catalogue, state-management rules, theming.
- [API Contracts](./api-contracts.md) — every HTTP route, every Server Action, the MCP JSON-RPC method/tool catalogue, error codes.
- [Data Models](./data-models.md) — full schema, RLS policies, FTS triggers, FK invariants, migration timeline.
- [Development Guide](./development-guide.md) — local setup, day-to-day commands, conventions, debugging cookbook.
- [Deployment Guide](./deployment-guide.md) — Vercel + Supabase config, CI footprint, rollback, observability.

## Existing Documentation

These files already lived in the repo and are referenced from the docs above.

- [README.md](../README.md) — public-facing project description, quick start, MCP integration snippet.
- [CLAUDE.md](../CLAUDE.md) — concise conventions for AI agents working in this repo.
- [GEMINI.md](../GEMINI.md) — companion agent guidance (Gemini-specific tweaks).
- [LICENSE](../LICENSE) — MIT.
- [docs/verification/rls-isolation.md](./verification/rls-isolation.md) — RLS isolation regression-test recipe (run before changing any RLS policy or the MCP service-role path).

### BMAD planning artifacts

The original spec-driven planning trail. Useful for "why was this designed this way?" questions.

- [Product brief](../_bmad-output/planning-artifacts/product-brief-prompt-repo-2026-02-07.md)
- [PRD](../_bmad-output/planning-artifacts/prd.md) — FR1–FR16, NFR1–NFR9
- [Planning architecture](../_bmad-output/planning-artifacts/architecture.md) — the original design intent (some drift; see `docs/architecture.md` § 13)
- [UX design specification](../_bmad-output/planning-artifacts/ux-design-specification.md)
- [Epics + stories](../_bmad-output/planning-artifacts/epics.md) — 6 epics, ~24 stories
- [PRD validation report](../_bmad-output/planning-artifacts/prd-validation-report.md)
- [Implementation readiness — 2026-02-08](../_bmad-output/planning-artifacts/implementation-readiness-report-2026-02-08.md)
- [Implementation readiness — 2026-02-11](../_bmad-output/planning-artifacts/implementation-readiness-report-2026-02-11.md)
- [Validation report — 2026-02-11](../_bmad-output/planning-artifacts/validation-report-2026-02-11.md)

### BMAD implementation artifacts (per-story)

One file per user story. Each one carries the rationale, tradeoffs, and ad-hoc decisions made during implementation. Read the relevant story file before changing a feature module.

| Epic | Stories |
|------|---------|
| **1 — Identity & Access** | [1-1 Project Init](../_bmad-output/implementation-artifacts/1-1-project-initialization-foundation.md) · [1-2 DB Foundation + RLS](../_bmad-output/implementation-artifacts/1-2-database-foundation-multi-tenant-rls.md) · [1-3 Auth (OAuth + Email)](../_bmad-output/implementation-artifacts/1-3-secure-authentication-oauth-email.md) · [1-4 Profile management](../_bmad-output/implementation-artifacts/1-4-user-profile-management.md) |
| **2 — Core Prompt Management** | [2-1 Two-table schema](../_bmad-output/implementation-artifacts/2-1-prompt-database-schema-two-table-pattern.md) · [2-2 Versioned save](../_bmad-output/implementation-artifacts/2-2-create-versioned-save-logic.md) · [2-3 List + detail view](../_bmad-output/implementation-artifacts/2-3-prompt-list-detail-view.md) · [2-4 Version history + restore](../_bmad-output/implementation-artifacts/2-4-version-history-restoration.md) |
| **3 — Resolution Engine** | [3-1 Variable parser](../_bmad-output/implementation-artifacts/3-1-variable-detection-regex-parser.md) · [3-2 JIT resolution form](../_bmad-output/implementation-artifacts/3-2-dynamic-resolution-form-just-in-time-ui.md) · [3-3 Real-time preview](../_bmad-output/implementation-artifacts/3-3-real-time-resolved-preview.md) · [3-4 One-click copy](../_bmad-output/implementation-artifacts/3-4-one-click-copy-clipboard-feedback.md) |
| **4 — Discovery & Organization** | [4-1 FTS](../_bmad-output/implementation-artifacts/4-1-high-performance-full-text-search.md) · [4-2 Cmd+K palette](../_bmad-output/implementation-artifacts/4-2-global-command-palette-cmd-k.md) · [4-3 Collections](../_bmad-output/implementation-artifacts/4-3-collections-management.md) · [4-4 Sidebar resilience](../_bmad-output/implementation-artifacts/4-4-ui-density-sidebar-resilience.md) · [Epic 4 retro](../_bmad-output/implementation-artifacts/epic-4-retro-2026-02-11.md) |
| **5 — Snapshots & UX Polish** | [5-1 Snapshot schema + RLS](../_bmad-output/implementation-artifacts/5-1-snapshot-database-schema-rls.md) · [5-2 Save + listing](../_bmad-output/implementation-artifacts/5-2-save-snapshot-listing.md) · [5-3 Re-resolution + hydration](../_bmad-output/implementation-artifacts/5-3-snapshot-re-resolution-hydration.md) · [5-4 Visual diff engine](../_bmad-output/implementation-artifacts/5-4-visual-diff-engine-ui.md) |
| **6 — Lifecycle** | [6-1 Lifecycle (archive/restore)](../_bmad-output/implementation-artifacts/6-1-prompt-lifecycle-management.md) |
| **Wrap-up** | [Final validation report](../_bmad-output/implementation-artifacts/final-validation-report.md) · [Test summary](../_bmad-output/implementation-artifacts/tests/test-summary.md) · [Sprint status](../_bmad-output/implementation-artifacts/sprint-status.yaml) |

> Note: features added **after** the original 6-epic PRD (public sharing links, MCP server export, AI providers + AI composer) do not have BMAD implementation files in this directory — read `docs/architecture.md` and `docs/api-contracts.md` for those.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Boot local Supabase (Docker required)
npx supabase start

# 3. Configure .env.local — copy keys from `npx supabase status` output
#    Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#              SUPABASE_SERVICE_ROLE_KEY (for /api/mcp)

# 4. Run dev server
npm run dev
# → http://localhost:3000  (Mailpit at http://localhost:54324 for confirmation emails)

# 5. Run tests
npm test                      # watch mode
npm test -- --run             # one-shot (matches CI)
npx vitest run path/to/x.test.ts   # single file

# 6. Reset DB + re-apply migrations whenever schema changes
npx supabase db reset
```

For full details on conventions, debugging, schema changes, and the MCP server: **[Development Guide](./development-guide.md)**.

## Drift watch (read this if you're following the planning architecture doc)

The original [planning architecture](../_bmad-output/planning-artifacts/architecture.md) and [CLAUDE.md](../CLAUDE.md) describe a `prompts.latest_version_id` pointer column. **It does not exist in the current schema.** Latest-version lookups go through `get_latest_prompt_version_id()` SQL function (see `docs/data-models.md` § 4 and `docs/architecture.md` § 13).

If you find another drift between planning docs and code, log it in `docs/architecture.md` § 13 — that's how this documentation stays trustworthy.
