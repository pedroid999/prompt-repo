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
3. Configure the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

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

## 🤖 Developed with BMAD & Gemini CLI

This project was built entirely using **Spec-Driven Development (SDD)** via the **BMad Method (BMM)** and the **Gemini CLI** agent.

### The Process:
1.  **Analysis**: A `Product Brief` and `PRD` were generated to define core value and technical constraints.
2.  **Architecture**: A formal `Architecture Decision Document` established the Two-Table pattern and Kanagawa design system.
3.  **Solutioning**: Requirements were decomposed into 4 Epics and 16 User Stories.
4.  **Implementation**: Implementation was executed through a **Red-Green-Refactor** cycle, where a Dev Agent implemented code and a Senior Dev Agent performed **Adversarial Code Reviews** to find and fix issues automatically.

All planning and implementation artifacts are preserved in:
- `_bmad-output/planning-artifacts/`
- `_bmad-output/implementation-artifacts/`

This ensures that any future developer (human or AI) has the full context of *why* every decision was made.

---

**License**: MIT  
**Developed by**: BMad Agent + Gemini CLI