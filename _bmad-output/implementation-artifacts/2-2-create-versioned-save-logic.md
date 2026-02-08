# Story 2.2: create-versioned-save-logic

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to create and save a new prompt with a version note,
so that the system automatically creates a new immutable version in the history.

## Acceptance Criteria

1. **Given** I am on the "Create Prompt" screen
   **When** I enter a title and content and click "Save"
   **Then** a new record is created in `prompts`
2. **And** a corresponding entry is created in `prompt_versions` with `version_number: 1`
3. **And** the operation is performed via a Server Action to ensure atomicity and security
4. **And** the form uses Zod for validation (Title required, Content required)
5. **And** the UI provides immediate feedback via Toasts (Spring Green for success)

## Tasks / Subtasks

- [x] Create Validation Schema: `src/lib/validation/prompt.ts` (AC: #4)
  - [x] Define `promptCreateSchema` with title, description (optional), content, and version_note (optional)
- [x] Implement Server Action: `src/features/prompts/actions/save-prompt.ts` (AC: #3)
  - [x] Use `supabase-ssr` server client
  - [x] Perform atomic insert into `prompts` and then `prompt_versions`
  - [x] Ensure `version_number` is correctly initialized to 1
- [x] Create UI Component: `src/features/prompts/components/create-prompt-form.tsx` (AC: #1, #5)
  - [x] Use `react-hook-form` + `@hookform/resolvers/zod`
  - [x] Style with `Geist Mono` for content areas and `Kanagawa` theme colors
  - [x] Implement Toast feedback for success/error
- [x] Add Vitest tests: `src/features/prompts/actions/save-prompt.test.ts` (AC: #2, #3)
  - [x] Mock Supabase client to verify transaction logic

## Dev Notes

- **Architecture Pattern:** Server Actions for Mutations. Next.js 15 recommendation.
- **Transaction Strategy:** Since Supabase JS client doesn't support multi-table transactions directly over HTTP without RPC, use a sequential insert with error handling. For absolute atomicity, a Supabase RPC could be used, but sequential insert is sufficient for MVP if handled carefully.
- **Styling:** Use `font-mono` for the prompt content `Textarea`.
- **Database Mapping:** Remember `snake_case` in DB vs `camelCase` in TS.

### Project Structure Notes

- Feature-based organization: `src/features/prompts/`
- Shared validation: `src/lib/validation/prompt.ts`
- Uses existing `src/lib/supabase/server.ts` for database access.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2: Create & Versioned Save Logic]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash (via Gemini CLI)

### Debug Log References

- Verified `src/features/` directory creation.
- Analyzed `sprint-status.yaml` and identified Story 2.2 as next backlog item.
- Research confirmed Server Actions as best practice for Next.js 15 + Supabase.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented Zod validation schema for prompt creation.
- Implemented Server Action `savePrompt` using `supabase-ssr` with atomic-like sequential inserts.
- Created `CreatePromptForm` using `react-hook-form` and `sonner` for toasts.
- Created `Textarea` UI component.
- Created `/prompts/create` page to host the form.
- Added comprehensive unit tests for validation and server action.

### File List

- src/lib/validation/prompt.ts
- src/lib/validation/prompt.test.ts
- src/features/prompts/actions/save-prompt.ts
- src/features/prompts/components/create-prompt-form.tsx
- src/features/prompts/actions/save-prompt.test.ts
- src/components/ui/textarea.tsx
- src/app/prompts/create/page.tsx

### Change Log

- Addressed code review findings (Date: 2026-02-08)

## Senior Developer Review (AI)

- **Review Outcome:** Approved (with fixes)
- **Review Date:** 2026-02-08
- **Fixes Applied:**
  - Implemented rollback logic in `savePrompt` action to handle partial failures.
  - Enforced "Spring Green" styling for success toasts.
  - Enhanced Zod schema with `trim()` and `max` length constraints.
  - Added missing test documentation to File List.
  - Expanded validation tests.