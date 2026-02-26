---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-prompt-repo-2026-02-07.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'prompt-repo'
user_name: 'pedroid'
date: '2026-02-11'
lastStep: 8
status: 'complete'
completedAt: '2026-02-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The project centers on a "Git for prompts" workflow. Key requirements include secure authentication (FR1-4), immutable versioning with history restoration (FR5-8), and a dynamic resolution engine that parses `{{variables}}` for real-time clipboard-ready output (FR9-11). Search must be high-performance (FR12) and organizational collections must be supported (FR13).

**Non-Functional Requirements:**
The system is driven by extreme performance targets: <100ms for search, <50ms for form generation, and <16ms for preview updates. Accessibility is a first-class citizen with 100% keyboard navigability. Security is handled via strict multi-tenant isolation and data encryption.

**Scale & Complexity:**
- Primary domain: Full-stack Web Application (Next.js + Supabase)
- Complexity level: Medium
- Estimated architectural components: ~6-8 (Auth, Search Indexer, Version Manager, Resolution Engine, UI Component Library, Collection Manager, RLS Layer, API/Edge Functions)

### Technical Constraints & Dependencies
- **Next.js 15 / React Server Components:** Hybrid rendering for speed and SEO.
- **PostgreSQL / Supabase:** Using `tsvector` for search and RLS for security.
- **Shadcn/UI + Tailwind:** For high-density, accessible UI components.
- **Immutable Data Pattern:** Backend logic must prevent overwriting historical versions.

### Cross-Cutting Concerns Identified
- **Performance/Latency:** Critical for the "flow state" experience.
- **Accessibility:** Keyboard-first requirement affects all interactive components.
- **Data Integrity:** Version history must be consistent and non-destructive.
- **State Management:** Synchronizing the Resolution Engine with the prompt template in real-time.

## Phase 2 Context Analysis: Snapshots & Visual Diffs

### Requirements Overview (Phase 2)

**Functional Requirements:**
- **FR14-16:** Persistent "Snapshots" for capturing and re-hydrating resolution states.
- **Visual Diffs:** Interactive comparison tool for historical versions.

**Non-Functional Requirements:**
- **NFR9 (Snapshot Latency):** Sub-50ms retrieval and form hydration.

### Technical Challenges & Implications

- **Snapshot State Persistence:** Requires a strategy to store variable values mapped to specific prompt versions.
- **Diffing UI:** Must handle large text blocks efficiently within the 400px-600px sidebar constraint.

### Cross-Cutting Concerns Identified (Phase 2)

- **Data Integrity:** Ensuring snapshots remain valid as prompts evolve.
- **UI Density:** Maintaining the high-density "sidecar" feel while adding complex comparison views.

## Core Architectural Decisions (Phase 2)

### Decision Priority Analysis (Phase 2)

**Critical Decisions (Block Implementation):**
- **Snapshot Referential Integrity:** Snapshots are locked to `prompt_version_id` to ensure immutability and schema safety.
- **Snapshot Data Storage:** Use a `jsonb` column for flexible variable storage.

**Important Decisions (Shape Architecture):**
- **Visual Diffing Strategy:** Client-side calculation using the `diff` library (v8.0.3) for sub-16ms interactive performance.

### Data Architecture (Phase 2)

**Snapshot Storage Pattern: Version-Locked JSONB**
- **Decision:** Create a `prompt_snapshots` table with a `prompt_version_id` foreign key and a `variables` `jsonb` column.
- **Rationale:** Prevents "broken" snapshots when templates change and leverages Postgres `jsonb` for high-performance variable retrieval.
- **Affects:** Resolution Engine, Version Manager.

### Frontend Architecture (Phase 2)

**Visual Diffing: Client-Side Myers Algorithm**
- **Decision:** Implement text comparisons using the `diff` library executed on the client.
- **Rationale:** Supports real-time version comparisons and live "preview" diffing without server round-trips.
- **Affects:** Prompt History View.

### Decision Impact Analysis (Phase 2)

**Implementation Sequence:**
1. Migration for `prompt_snapshots` table with RLS policies.
2. Resolution Engine update to support "Save Snapshot" and "Re-resolve" (form hydration).
3. Version Comparison component using `diff` library.

**Cross-Component Dependencies:**
- **Snapshots** depend on **Immutable Versions** (Phase 1) to guarantee referential integrity.
- **Diffing UI** requires **Version History** data to be pre-fetched or streamed.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web Application based on project requirements analysis

### Starter Options Considered

1.  **Supabase `with-supabase` Template**:
    *   **Pros:** Pre-configured cookie-based auth, `@supabase/ssr`, and Tailwind. Optimized for the exact stack you requested.
    *   **Cons:** May need manual upgrades to Next.js 15 if the template lags slightly behind the bleeding edge.
2.  **`npx create-next-app@latest` (Manual)**:
    *   **Pros:** Guaranteed latest Next.js 15 features (RSC, Turbopack). Complete control over structure.
    *   **Cons:** Requires manual setup of Supabase middleware, SSR clients, and Shadcn UI initialization.
3.  **T3 Stack (`create-t3-app`)**:
    *   **Pros:** Excellent type-safety.
    *   **Cons:** Often biased towards Prisma/tRPC; may add unnecessary overhead for a Supabase-centric project.

### Selected Starter: Next.js 15 + Supabase SSR (Manual Init)

**Rationale for Selection:**
To ensure we leverage Next.js 15's performance and Shadcn UI's high-density components (essential for the sidecar UX), a manual initialization with the `@latest` flag followed by the official Supabase SSR setup is the most professional path. This prevents "template bloat" and ensures absolute compatibility with the bleeding-edge RSC patterns required for the Resolution Engine.

**Initialization Command:**

```bash
# 1. Initialize Next.js 15
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Initialize Shadcn UI (Terminal-Adjacent Theme)
npx shadcn-ui@latest init -d -c zinc

# 3. Install Supabase & SSR Utilities
npm install @supabase/ssr @supabase/supabase-js
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript (Strict) on Node.js/Vercel Edge.

**Styling Solution:**
Tailwind CSS with Shadcn UI components (Zinc/Dark-first theme).

**Build Tooling:**
Turbopack (Next.js 15) for sub-100ms HMR.

**Testing Framework:**
Vitest (to be added) for the Resolution Engine regex logic.

**Code Organization:**
`src/app` router pattern with `src/components/ui` for primitives and `src/lib/supabase` for SSR clients.

**Development Experience:**
Fast Refresh, ESLint, and PostCSS.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data Immutability Strategy (Two-Table Pattern)
- Search Architecture (PostgreSQL tsvector)
- Authentication & Security (Supabase SSR + RLS)

**Important Decisions (Shape Architecture):**
- Resolution Engine State Management (React Hook Form + Zod)
- API Pattern (Next.js Server Actions)

**Deferred Decisions (Post-MVP):**
- Visual Version Diffing (Deferred to Phase 2)
- Multi-Model Template Metadata (Deferred to Phase 2)

### Data Architecture

**Versioning Strategy: Two-Table (HEAD + History)**
- **Decision:** Use a `prompts` table for active content and a `prompt_versions` table for immutable history.
- **Rationale:** Optimizes search performance by keeping the primary table lean while ensuring 100% historical integrity.
- **Affects:** Version Manager, Search Indexer.

**Search Engine: Supabase/PostgreSQL tsvector**
- **Decision:** Implement full-text search using native Postgres `tsvector` with a GIN index.
- **Rationale:** Provides sub-100ms latency without external service complexity or cost.
- **Affects:** Global Search Component.

### Authentication & Security

**Auth & Authorization: Supabase SSR + RLS**
- **Decision:** Use `@supabase/ssr` for cookie-based auth and Row Level Security for multi-tenant data isolation.
- **Rationale:** Industry standard for Next.js/Supabase projects; ensures secure, performant isolation.
- **Affects:** All Data Access Layers.

### Frontend Architecture

**Resolution Engine State: React Hook Form + Zod**
- **Decision:** Use React Hook Form to manage dynamic variable inputs with Zod for real-time validation.
- **Rationale:** Handles complex dynamic field generation and character-by-character resolution with minimal re-renders.
- **Affects:** Resolution Mode Component.

### Infrastructure & Deployment

**Hosting & CI/CD: Vercel**
- **Decision:** Standard Next.js deployment on Vercel with automated GitHub integration.
- **Rationale:** Native support for Next.js 15 features and edge functions.
- **Affects:** Deployment Workflow.

### Decision Impact Analysis

**Implementation Sequence:**
1. Setup Next.js 15 + Supabase SSR Foundation.
2. Implement Database Schema (Two-Table + RLS).
3. Build Auth Layer (Middleware + Login).
4. Implement High-Performance Search Index.
5. Build Resolution Engine (Regex Parser + Dynamic Form).

**Cross-Component Dependencies:**
- The **Resolution Engine** depends on the **Two-Table Schema** to save and retrieve versions correctly.
- **Search performance** is directly impacted by the separation of the History table.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 areas where AI agents could make different choices (Naming, Structure, Formatting, Communication, Process).

### Naming Patterns

**Database Naming Conventions:**
- **Strict snake_case** for all tables and columns (e.g., `prompt_versions`, `user_id`).
- Standard native PostgreSQL convention.

**API Naming Conventions:**
- **Plural nouns** for resources in internal API paths (though primarily using Server Actions).
- Response keys must be mapped to **camelCase** for JS consumption.

**Code Naming Conventions:**
- **Variables/Functions:** `camelCase` (e.g., `getPromptById`).
- **Components/Classes:** `PascalCase` (e.g., `ResolutionForm`).
- **File Names:** `kebab-case.tsx` (e.g., `prompt-list.tsx`).

### Structure Patterns

**Project Organization:**
- **Feature-based folders** under `src/features/` (e.g., `src/features/search`, `src/features/versions`).
- Shared UI primitives in `src/components/ui` (Shadcn standard).

**File Structure Patterns:**
- **Co-located Tests:** `*.test.tsx` or `*.spec.ts` files must live next to the file they test.
- **Server Components:** Default to `.tsx` in the `app/` directory; explicitly use `"use client"` only where state/interaction is required.

### Format Patterns

**API Response Formats:**
- **Standard Wrapper:** All Server Actions must return `{ data: T | null, error: string | null }`.

**Data Exchange Formats:**
- **JSON:** Strict `camelCase` for all JSON keys in transit and in `jsonb` database columns.
- **Dates:** Always use ISO 8601 strings.

### Process Patterns

**Error Handling Patterns:**
- **Functional Errors:** Handled via the response wrapper and displayed via Toasts.
- **System Errors:** Caught by Next.js `error.tsx` boundaries.

**Loading State Patterns:**
- **Route Level:** Next.js `loading.tsx` for initial page loads.
- **Component Level:** Shadcn Skeletons for fine-grained async state.

### Enforcement Guidelines

**All AI Agents MUST:**
- Check for existing co-located tests before creating new ones.
- Follow the `snake_case` (DB) to `camelCase` (Code) mapping.
- Prioritize Server Components and Server Actions over client-side fetching.
- **Phase 2:** Use the `hydrateResolutionForm` utility for all Snapshot-to-Form mappings.
- **Phase 2:** Use the `DiffViewer` component for all text comparison UI, ensuring consistent Tailwind styling.

**Pattern Enforcement:**
- Verified via `npm run lint` and `tsc` before any story completion.
- Documented violations should be corrected in the "Code Review" phase.

### Phase 2 Implementation Patterns

**Naming & Database Patterns:**
- **Table Name:** `prompt_snapshots` (consistent with `prompt_versions`).
- **Columns:** `user_id` (FK), `prompt_version_id` (FK), `name` (text), `variables` (`jsonb`).
- **Constraint:** RLS must ensure snapshots are private to the `auth.uid()`.

**Hydration & State Management:**
- **Pattern:** Centralized hydration utility `hydrateResolutionForm(snapshot: Snapshot)` to map `jsonb` data to React Hook Form state.
- **Conflict Prevention:** All agents must use this utility to handle edge cases like missing variables or renamed keys consistently.

**UI & Interaction Patterns:**
- **Diff Rendering:** Unified `DiffViewer` component using the `diff` library. Standard Tailwind classes (`text-green-500`, `text-red-500`, `bg-green-500/10`) must be used for all diff highlights.
- **Feedback:** "Re-resolve" from a snapshot must trigger a "Snapshot Applied" toast notification for user confirmation.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
prompt-repo/
├── .github/workflows/ci.yml       # Vercel & Vitest CI
├── src/
│   ├── app/                       # Next.js 15 App Router
│   │   ├── layout.tsx             # Root layout with sidebar
│   │   ├── page.tsx               # Library view (Search + List)
│   │   ├── auth/                  # Login/Signup routes
│   │   ├── prompts/               # Prompt detail & history routes
│   │   └── globals.css            # Tailwind + Kanagawa theme
│   ├── components/
│   │   ├── ui/                    # Shadcn/UI primitives (Zinc)
│   │   └── shared/                # Project-wide reusable components
│   ├── features/                  # Core Business Logic
│   │   ├── search/                # tsvector logic & search components
│   │   ├── resolution-engine/     # Regex parser, forms & preview
│   │   ├── version-control/       # Immutability logic & history views
│   │   └── collections/           # Organization logic
│   ├── lib/
│   │   ├── supabase/              # SSR Client & Middleware
│   │   ├── utils/                 # Formatting & regex helpers
│   │   └── validation/            # Zod schemas (Prompts/Versions)
│   ├── types/                     # Global TS definitions
│   └── middleware.ts              # Global Auth protection
├── supabase/
│   ├── migrations/                # Two-Table schema + RLS policies
│   └── seed.sql                   # Sample data for development
├── public/                        # Static assets & icons
├── vitest.config.ts               # Test configuration
├── next.config.ts                 # Next.js 15 config
├── tailwind.config.ts             # Theme overrides
└── tsconfig.json
```

### Architectural Boundaries

**API Boundaries:**
All data mutation occurs via **Next.js Server Actions** located within their respective `features/` folders. No public API routes are exposed unless explicitly required.

**Component Boundaries:**
Features are independent (e.g., `ResolutionEngine` has no direct knowledge of `VersionControl`). Communication between features happens through data composition in `page.tsx`.

**Data Boundaries:**
**PostgreSQL RLS** ensures multi-tenant isolation at the database level. Each query must be made within the context of an authenticated user session.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- **Identity & Access (FR1-4):** `src/app/auth/` and `src/lib/supabase/`.
- **Prompt Management (FR5-8):** `src/features/version-control/` and `supabase/migrations/`.
- **Templating (FR9-11):** `src/features/resolution-engine/`.
- **Search (FR12):** `src/features/search/`.

**Cross-Cutting Concerns:**
- **Authentication:** `src/middleware.ts` and `src/lib/supabase/`.
- **UI System:** `src/components/ui/` (Shadcn components).

## Project Structure & Boundaries (Phase 2 Updates)

### Updated Feature Mapping

**Snapshots (FR14-16)**
- **Feature Home:** `src/features/snapshots/`
- **Database:** `prompt_snapshots` table
- **Integration:** Hooks into `src/features/resolution-engine/` for state hydration.

**Visual Diffs**
- **Feature Home:** `src/features/version-control/components/diff-viewer.tsx`
- **Logic:** Client-side using `diff` library.
- **Integration:** Displayed within the version history timeline.

### Architectural Boundaries (Phase 2)

**Snapshot Hydration Boundary:**
All Snapshot data must pass through `src/features/resolution-engine/utils/hydration.ts` before being applied to the UI state. This prevents malformed `jsonb` data from crashing the resolution form.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are highly compatible. Next.js 15 and Supabase SSR are the current industry standard for the proposed stack. The Two-Table data model provides the necessary performance backing for the sub-100ms search target.

**Pattern Consistency:**
The naming and structural patterns explicitly support the architectural decisions, specifically the mapping from snake_case database columns to camelCase TypeScript objects.

**Structure Alignment:**
The feature-based directory structure clearly separates the major architectural components, supporting the desired boundaries and independent feature evolution.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
Every core feature identified in the PRD and UX spec has a defined location and technical strategy within the architecture.

**Functional Requirements Coverage:**
All 16 Functional Requirements (including Phase 2 Snapshots) are architecturally supported, with clear mappings to specific components and data models.

**Non-Functional Requirements Coverage:**
The sub-100ms search and high-density UX requirements are addressed via tsvector indexing and Shadcn/Tailwind component density rules. Phase 2 Snapshot latency is addressed via jsonb storage and client-side hydration.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical decisions regarding data, search, auth, state management, snapshots, and diffing are fully documented with rationale.

**Structure Completeness:**
The project structure is complete, specific, and updated for Phase 2 features.

**Pattern Completeness:**
Naming, structural, and process patterns (including hydration and diffing) are comprehensive enough to guide multiple AI agents without conflict.

### Gap Analysis Results
- **Priority: Low** - "Collections" logic (FR13) is minimally defined but has a dedicated folder for future expansion.
- **Priority: Low** - Visual Version Diffing is now fully specified for Phase 2.

### Architecture Completeness Checklist
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clear performance strategy for search, resolution, and diffing.
- Strict multi-tenant isolation via RLS.
- High-density, keyboard-first UX focus.
- Clean feature-based code organization with explicit Phase 2 patterns.

**Areas for Future Enhancement:**
- Phase 3: Prompt Chaining and CLI/IDE extensions.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.

**First Implementation Priority:**
Migration for `prompt_snapshots` table with RLS policies.
