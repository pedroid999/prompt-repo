# GEMINI.md - PromptRepo Context

This file provides instructional context for AI agents (like Gemini CLI) interacting with the **PromptRepo** project.

---

## 🚀 Project Overview

**PromptRepo** is a "Git for Prompts" application designed as a high-density development companion. It allows users to store, version, search, and resolve dynamic prompt templates.

- **Primary Technologies**: Next.js 15 (App Router, Server Actions), Supabase (PostgreSQL + RLS), Tailwind CSS 4, shadcn/ui.
- **Core Features**: 
  - **Two-Table Versioning**: Immutable history in `prompt_versions`, active metadata in `prompts`.
  - **Resolution Engine**: Regex-based parsing of `{{variables}}` with real-time previews.
  - **Search**: High-performance PostgreSQL `tsvector` + GIN indexing.
  - **Command Palette**: `Cmd+K` interface for keyboard-first navigation.
  - **Sidecar UX**: Optimized for a 400px width persistent sidebar.

---

## 🛠 Building and Running

### Development Commands
- `npm install`: Install dependencies.
- `npx supabase start`: Start local development environment (requires Docker).
- `npm run dev`: Launch the Next.js development server.
- `npm run lint`: Execute ESLint checks.
- `npx tsc --noEmit`: Perform TypeScript type checking.

### Testing
- `npm test`: Run all tests using Vitest.
- `npx vitest run <path>`: Run specific test files.
- `npm run test:ui`: Open the Vitest interactive UI.

---

## 📐 Development Conventions

### Methodologies
- **Spec-Driven Development (SDD)**: This project follows the **BMad Method (BMM)**. All features are planned as Epics and User Stories before implementation.
- **Artifacts**: Planning and implementation logs are stored in `_bmad-output/`. Always refer to these for historical context.

### Project Structure
- `src/features/`: Domain-driven logic (e.g., `collections`, `prompts`, `search`).
- `src/components/ui/`: Atomic UI primitives (shadcn).
- `src/lib/supabase/`: Supabase client and middleware logic.
- `supabase/migrations/`: SQL schema definitions and RLS policies.

### Coding Standards
- **Naming**: 
  - Database: `snake_case` (tables/columns).
  - Code: `camelCase` (variables/functions), `PascalCase` (components).
  - Files: `kebab-case.tsx`.
- **Patterns**: Use Server Actions for all data mutations. Prefer Server Components (`RSC`) by default.
- **Density**: UI components must use responsive padding (`p-2 md:p-6`) to remain functional at **400px**.
- **Testing**: Co-locate tests where possible or place them in appropriate `__tests__` or feature folders. Ensure 100% pass rate before completion.

### Security (RLS)
- Every table has Row Level Security enabled.
- Data access must always be scoped to `auth.uid()`.
- Check `supabase/migrations/` for active policy definitions.

---

## 🤖 AI Agent Interaction Rules

1. **Verify State**: Always check `_bmad-output/implementation-artifacts/sprint-status.yaml` to understand the current implementation progress.
2. **Follow Artifacts**: When implementing a story, adhere strictly to the Acceptance Criteria defined in the `.md` file for that story.
3. **Red-Green-Refactor**: Always write or update tests alongside feature changes.
4. **Adversarial Review**: Self-challenge the implementation for edge cases, accessibility, and density violations before marking a task complete.
