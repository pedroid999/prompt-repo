# PromptRepo: Git for Prompts

**PromptRepo** is a high-performance, version-controlled prompt management system designed to be used as a persistent "sidecar" companion to your development workflow. It features dynamic variable resolution, real-time previews, and sub-100ms full-text search.

---

## 🏗 Architecture & Tech Stack

Built for speed, density, and reliability using:

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, RSC)
- **Database/Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + SSR)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Theme**: [Kanagawa](https://github.com/rebelot/kanagawa.nvim) (Dragon/Fuji/Crystal Blue)
- **Typography**: [Geist Mono](https://vercel.com/font/mono)
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library
- **Core Pattern**: **Two-Table Versioning** (`prompts` for HEAD metadata, `prompt_versions` for immutable history).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+
- Docker (for Supabase Local Development)
- Supabase CLI (`npm install -g supabase`)

### 2. Setup
```bash
# Clone and install
git clone <repo-url>
cd prompt-repo
npm install

# Initialize Supabase Local (requires Docker)
npx supabase start
```

### 3. Environment Variables & Auth
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# OAuth (Optional for local)
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

### 4. Local Authentication
- **Email/Password**: When you sign up locally, Supabase sends a confirmation email. Since we are in a local environment, these emails are captured by **Mailpit**.
- **Mailpit UI**: Open [http://localhost:54324](http://localhost:54324) to see the confirmation emails and click the links.
- **OAuth (GitHub/Google)**: To test OAuth locally, ensure you have configured the `client_id` and `secret` in your `.env.local` (as shown above). The Supabase local CLI will automatically pick them up to configure the local auth service.

### 5. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). Use `Cmd+K` to search immediately.

---

## ☁️ Deployment

### Supabase (Database & Auth)
1. Create a new project at [supabase.com](https://supabase.com).
2. Apply migrations located in `supabase/migrations/`:
   ```bash
   supabase link --project-ref <your-project-id>
   supabase db push
   ```
3. Enable **GitHub/Google OAuth** in the Supabase Auth dashboard if required.

### Vercel (Frontend)
1. Push your code to GitHub.
2. Import the project into Vercel.
3. Configure the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for the MCP server endpoint)
4. Deploy.

---

## 🤖 MCP Server — Agent Integration

PromptRepo exposes a **Model Context Protocol (MCP) server** so that AI agents (Claude Code, Claude Desktop, Cursor, and any MCP-compatible tool) can query and resolve your prompts directly at runtime — no copy-paste required.

### Available Tools

| Tool | Description |
|------|-------------|
| `list_prompts` | Returns your prompts (or public prompts for anonymous callers) |
| `get_prompt` | Fetches a single prompt by ID |
| `resolve_prompt` | Fetches a prompt and substitutes `{{variable}}` placeholders with provided values |
| `search_prompts` | Full-text search over your prompt library |

### Connecting Claude Desktop / Claude Code

Generate an API key from your `/profile` page, then add the server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-prompts": {
      "url": "https://your-app-url/api/mcp",
      "headers": { "x-api-key": "YOUR_API_KEY" }
    }
  }
}
```

Anonymous callers (no key) can access public prompts only.

### Production Environment Variable

Add `SUPABASE_SERVICE_ROLE_KEY` to your deployment environment (Vercel, Railway, etc.). The value is found in your Supabase project under **Settings → API → service_role**.

---

## 🛠 Maintenance & Improvement

### Folder Structure
- `src/features/`: Domain-driven logic (Search, Resolution Engine, Collections).
- `src/components/ui/`: Atomic shadcn primitives.
- `src/lib/supabase/`: SSR clients and middleware.
- `supabase/migrations/`: Self-contained SQL evolution.

### Key Workflows
- **Search**: Powered by PostgreSQL `tsvector`. If you add new fields to index, update the `update_prompt_search_tokens()` trigger in the migration.
- **Resolution**: The regex parser lives in `src/lib/utils/variable-parser.ts`.
- **UI Density**: The layout is optimized for a **400px width**. Use mobile-first Tailwind classes (`p-2 md:p-6`) to maintain this "sidecar" resilience.

### Running Tests
```bash
npm test          # Run all tests
npm run test:ui   # Vitest UI
```

---

## 🤖 Developed with AI-Assisted Spec-Driven Development

This project was built entirely using **Spec-Driven Development (SDD)** — a methodology where every feature goes through a structured pipeline (explore → propose → spec → design → tasks → implement → verify → archive) before a single line of code is written.

### Tools Used

| Tool | Role |
|------|------|
| [BMad Method](https://github.com/bmadcode/bmad-method) + [Gemini CLI](https://github.com/google-gemini/gemini-cli) | Initial architecture, PRD, and core implementation |
| [Claude Code](https://claude.ai/code) (Anthropic) | Feature development, SDD orchestration, and agent coordination |
| [Engram](https://github.com/gentleman-programming/engram) | Persistent memory for specs, designs, and SDD artifacts across sessions |

### The Process

1. **Analysis** — `Product Brief` and `PRD` generated to define core value and technical constraints.
2. **Architecture** — Formal `Architecture Decision Document` established the Two-Table versioning pattern and Kanagawa design system.
3. **Solutioning** — Requirements decomposed into Epics, User Stories, and per-change task breakdowns.
4. **Implementation** — Red-Green-Refactor cycle with Dev and Senior Dev agents performing adversarial code reviews.
5. **Continuous iteration** — New features (public sharing links, MCP server export) added via the full SDD cycle using Claude Code as orchestrator and Engram as the artifact store.

All planning and implementation artifacts are preserved in:
- `_bmad-output/planning-artifacts/`
- `_bmad-output/implementation-artifacts/`

This ensures any future developer (human or AI) has the full context of *why* every decision was made.

---

**License**: MIT
**Developed by**: BMad Agent + Gemini CLI + Claude Code