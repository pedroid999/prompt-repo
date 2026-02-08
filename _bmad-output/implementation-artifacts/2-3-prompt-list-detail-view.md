# Story 2.3: prompt-list-detail-view

## Senior Developer Review (AI)

**Outcome:** Approve
**Date:** 2026-02-08

### Action Items
- [x] Optimize `getPrompts` query to reduce RSC payload and improve performance.
- [x] Remove `any` from data fetching layer for better type safety.
- [x] Add integration tests for `PromptsContainer` covering selection logic.
- [x] Fix mobile overlap between Back button and PromptDetail header.
- [x] Upgrade test assertions to `toBeInTheDocument()` for better DOM verification.

### Severity Breakdown
- **High:** 2 (Performance, Type Safety)
- **Medium:** 3 (Testing Gaps, Dependency consistency)
- **Low:** 2 (UI Polish, Test Assertions)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to browse my library of prompts and view the details of a specific prompt,
so that I can manage my collected prompt assets.

## Acceptance Criteria

1. **Given** I have saved prompts in my library
   **When** I view the library list
   **Then** I see high-density cards with titles and descriptions using Kanagawa styling
2. **And** clicking a prompt shows the detail view with the most recent version content in Geist Mono
3. **And** the library view supports high-density layout (10+ visible prompts without scrolling in sidebar-like view)
4. **And** the UI remains fully functional at 400px width per NFR4
5. **And** data fetching uses React Server Components for performance

## Tasks / Subtasks

- [x] Create List Component: `src/features/prompts/components/prompt-list.tsx` (AC: #1, #3)
  - [x] Implement high-density card layout
  - [x] Use `ScrollArea` for the list container
  - [x] Style with Kanagawa colors (Dragon background, Fuji text, Suminkashi borders)
- [x] Create Detail Component: `src/features/prompts/components/prompt-detail.tsx` (AC: #2)
  - [x] Display title, description, and most recent version content
  - [x] Use `Geist Mono` for the prompt content block
  - [x] Style content block with a subtle background and border
- [x] Implement Data Fetching: `src/features/prompts/queries/get-prompts.ts` (AC: #5)
  - [x] Fetch all prompts for the authenticated user
  - [x] Join with `prompt_versions` to get the latest version content (highest `version_number`)
- [x] Update Main Page: `src/app/page.tsx` (AC: #4)
  - [x] Implement a two-pane layout (List on left/top, Detail on right/bottom)
  - [x] Ensure layout is responsive and works at 400px width (stacking or swapping)
- [x] Add Tests: `src/features/prompts/components/prompt-list.test.tsx`
  - [x] Verify rendering of multiple prompts
  - [x] Verify empty state handling

## Dev Notes

- **Architecture Pattern:** Feature-based components in `src/features/prompts/components/`.
- **Data Fetching:** Use `supabase-ssr` server client in a query function. Ensure RLS is active (already handled by DB policies).
- **Styling:**
  - Sidebar-first design means we should prioritize vertical space and high information density.
  - Content block must use `font-mono`.
- **Performance:** Sub-100ms targets. Use RSCs for initial data fetch.

### Project Structure Notes

- Keep components modular. `PromptList` should be independent of `PromptDetail`.
- Leverage existing `Card` and `ScrollArea` (if available) components from shadcn.

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#2. Core User Experience]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: Prompt List & Detail View]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: src/app/globals.css]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

- Implemented `getPrompts` query using Supabase SSR server client with join on `prompt_versions`.
- Created `PromptList` component with Kanagawa-themed high-density cards.
- Created `PromptDetail` component using Geist Mono for content display.
- Implemented `PromptsContainer` for managing selection state and responsive two-pane layout.
- Updated `src/app/page.tsx` to use React Server Components for data fetching.
- Added unit tests for `PromptList` and `PromptDetail` using Vitest and React Testing Library.
- Verified all Acceptance Criteria are met.

### File List

- `src/features/prompts/types/index.ts`
- `src/features/prompts/queries/get-prompts.ts`
- `src/features/prompts/components/prompt-list.tsx`
- `src/features/prompts/components/prompt-detail.tsx`
- `src/features/prompts/components/prompts-container.tsx`
- `src/features/prompts/components/prompt-list.test.tsx`
- `src/features/prompts/components/prompt-detail.test.tsx`
- `src/app/page.tsx`
- `src/components/ui/scroll-area.tsx`

