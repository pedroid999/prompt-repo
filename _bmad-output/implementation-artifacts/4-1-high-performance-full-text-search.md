# Story 4.1: High-Performance Full-Text Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to implement PostgreSQL `tsvector` indexing for the prompt library,
so that searches remain sub-100ms even as the library grows.

## Acceptance Criteria

1. **Sub-100ms Search Performance**: Given a library of 100+ prompts, search results return in <100ms.
2. **Comprehensive Indexing**: Search covers Title, Description, and the *Content* of the latest version.
3. **Relevance Ranking**: Results are ranked by relevance (e.g., title match > description match > content match).
4. **Partial Matching**: Search supports partial matches (e.g., "arch" finds "architecture").
5. **Collection Filtering**: Search results can be filtered by Collection ID (if collections implemented) or User ID (RLS enforcement).
6. **Zero Leaks**: RLS policies prevent users from finding or seeing other users' prompts via search.

## Tasks / Subtasks

- [x] **Database Migration: Search Infrastructure**
  - [x] Create function `update_prompt_search_tokens` to generate `tsvector` from title, description, and content.
  - [x] Add `search_tokens` column to `prompts` table (type `tsvector`).
  - [x] Create GIN index on `prompts(search_tokens)`.
  - [x] Create trigger on `prompts` (INSERT/UPDATE) to update `search_tokens`.
  - [x] Create trigger on `prompt_versions` (INSERT) to update parent `prompts.search_tokens`.
  - [x] Create RPC function `search_prompts(query_text, filter_options)` to execute ranked search.

- [x] **Backend Service: Search Feature**
  - [x] Create `src/features/search/actions.ts` with `searchPrompts` Server Action.
  - [x] Implement input validation (Zod) for search query.
  - [x] Call Supabase RPC from Server Action.

- [x] **Frontend Component: Search Bar**
  - [x] Create `src/components/features/search/search-bar.tsx`.
  - [x] Implement debounced input (e.g., 300ms).
  - [x] Show loading state.

- [x] **Integration: Library Page**
  - [x] Update `src/app/page.tsx` to handle search state (URL params or local state).
  - [x] Display search results using existing Prompt Card components.

- [x] **Verification & Testing**
  - [x] Add unit test for `searchPrompts` action.
  - [x] Verify RLS by attempting to search another user's prompt (should return 0 results).
  - [x] Verify performance with ~100 generated dummy prompts.

## Dev Notes

### Architecture Patterns
- **Two-Table Pattern**: Search index lives on `prompts`, but data sources from `prompts` and `prompt_versions`.
- **Performance**: Use GIN index on pre-computed `tsvector` column. Do not compute `to_tsvector` on the fly in the query.
- **Security**: Use Supabase RPC with `security definer` CAREFULLY, or better `security invoker` (default) to respect RLS. **Crucial:** The RPC must respect RLS. If using `language plpgsql`, ensure the query implicitly checks RLS or explicit `WHERE` clause. Standard `SELECT ... FROM prompts` inside RPC respects RLS if not `SECURITY DEFINER`.

### Source Tree Components
- `supabase/migrations/` (New migration file)
- `src/features/search/` (New directory)
- `src/components/features/search/` (New directory)
- `src/app/page.tsx`

### Testing Standards
- Use `vitest` for logic.
- Manual verification for RLS.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Search Engine: Supabase/PostgreSQL tsvector]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1: High-Performance Full-Text Search]

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (via BMAD dev-story workflow)

### Debug Log References
- Implemented `search_prompts` RPC with prefix matching for partial words.
- Integrated `SearchBar` into `Home` page with URL search params.
- Verified logic with Vitest.

### Completion Notes List
- Created migration `20260208000002_search_index.sql`.
- Created `SearchBar` component with debounced URL updates.
- Updated `Home` page to use `searchPrompts` server action.
- Added unit tests for `searchPrompts`.
- **Code Review Fixes (2026-02-08):**
    - Updated RPC to support `filter_user_id` and `filter_collection_id` (AC 5).
    - Added unit tests for filtering.
    - Added `SEARCH_DEBOUNCE_MS` constant.
    - Improved error handling in `actions.ts`.

### File List
- `supabase/migrations/20260208000002_search_index.sql`
- `src/features/search/actions.ts`
- `src/features/search/types.ts`
- `src/features/search/actions.test.ts`
- `src/components/features/search/search-bar.tsx`
- `src/app/page.tsx`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
