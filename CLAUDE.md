# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Next.js dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint check
npm run test       # Run all Vitest tests
npx vitest run src/path/to/file.test.ts  # Run a single test file
npx supabase start # Start local Supabase (requires Docker)
```

Local email testing (auth confirmation) uses Mailpit at `http://localhost:54324`.

## Tech Stack

- **Next.js 15** — App Router, Server Components, Server Actions
- **Supabase** — PostgreSQL + RLS + SSR auth (`@supabase/ssr`)
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives)
- **Zod v4** + **React Hook Form** for validation
- **Vitest** + **React Testing Library** for tests
- **TypeScript** with `@/*` path alias (maps to `src/`)

## Architecture

### Directory Layout

```
src/
├── app/                  # Next.js App Router pages + layouts
│   ├── auth/             # Login, signup, OAuth callbacks (server actions)
│   ├── prompts/          # Create prompt page
│   ├── p/[promptId]/     # Public read-only sharing links (unauthenticated)
│   └── profile/
├── features/             # Domain modules (queries + server actions + types)
│   ├── prompts/          # Prompt CRUD, lifecycle (archive/restore)
│   ├── collections/      # User-owned groupings
│   ├── search/           # Full-text search (PostgreSQL tsvector)
│   ├── resolution-engine/# Variable substitution engine
│   └── snapshots/        # Point-in-time prompt captures
├── components/
│   ├── ui/               # Atomic shadcn primitives
│   ├── features/         # Feature-specific React components
│   └── shared/           # Header, auth buttons, global layout pieces
└── lib/
    ├── supabase/         # SSR client factory, middleware helpers
    ├── utils/            # cn.ts (clsx + tailwind-merge), variable-parser.ts
    └── validation/       # Zod schemas
```

### Data Model

Two-table versioning: `prompts` holds HEAD state + `latest_version_id` pointer; `prompt_versions` stores immutable history. Mutations create a new version row and update the HEAD pointer atomically.

Full-text search uses a PostgreSQL `tsvector` trigger (`update_prompt_search_tokens`) — search queries go through a Server Action in `src/features/search/actions.ts`.

### Supabase Client Usage

Three distinct clients — always pick the right one:
- `createServerClient()` in Server Components / Route Handlers (reads cookies, no mutations to cookies)
- `createMiddlewareClient()` in `middleware.ts` (refreshes session, can set cookies)
- `createBrowserClient()` in Client Components (singleton)

### Auth & Middleware

`src/middleware.ts` protects all routes except `/p/*` (public sharing) and `/auth/*`. It delegates to `src/lib/supabase/middleware.ts` which refreshes the Supabase session and redirects unauthenticated users to `/auth/login`.

### Patterns

- **Data fetching** — async Server Components; avoid client-side fetching where possible
- **Mutations** — Server Actions (not API routes)
- **Styling** — Kanagawa theme colors are hardcoded (e.g., `bg-[#16161D]`, `text-[#DCD7BA]`); use `cn()` for conditional class merging
- **UI target** — optimized for ~400px width (mobile sidecar); use `md:` breakpoints for wider viewports
- **Keyboard shortcuts** — `Cmd+K` search, arrow-key list navigation, `Ctrl+C/V` copy-paste in prompt editor

### Database Migrations

Schema changes go in `supabase/migrations/` as versioned SQL files. Run `npx supabase db reset` to apply all migrations locally.

## Git Workflow

- `main` — production
- `develop` — default integration branch
- Feature branches merge into `develop`

## MCP Server

The app exposes a Model Context Protocol server so that AI agents (e.g. Claude Code, Claude Desktop) can read and resolve prompts directly.

**Endpoint:** `POST /api/mcp` — JSON-RPC 2.0 over HTTP

**Auth:** Pass an API key in one of two headers:

- `Authorization: Bearer <key>` (preferred)
- `x-api-key: <key>` (fallback)

API keys are created and managed at `/profile`. Anonymous callers (no key) receive public prompts only.

**Available tools:**

| Tool | Description |
|------|-------------|
| `list_prompts` | Returns the caller's prompts (or public prompts if anonymous) |
| `get_prompt` | Fetches a single prompt by ID |
| `resolve_prompt` | Fetches a prompt and substitutes variable placeholders with provided values |
| `search_prompts` | Full-text search over the caller's prompts |

**Claude Desktop / Claude Code config (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "my-prompts": {
      "url": "https://your-app-url/api/mcp",
      "headers": { "x-api-key": "YOUR_KEY_HERE" }
    }
  }
}
```

Replace `your-app-url` with your deployment domain and `YOUR_KEY_HERE` with a key generated from `/profile`.

**Note:** The `/api/mcp` route is excluded from the session-redirect middleware so that API key authentication works without a browser session cookie.
