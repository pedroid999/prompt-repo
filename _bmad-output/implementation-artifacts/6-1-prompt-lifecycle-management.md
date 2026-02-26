# Story 6.1: Prompt Lifecycle Management (Archive/Restore + Metadata Edit)

Status: done

## Story

As a user,
I want to archive prompts instead of deleting them immediately and edit prompt metadata,
so that I can keep my library organized without losing version history.

## Acceptance Criteria

1. Users can archive an active prompt from the prompt list context menu.
2. Archived prompts are hidden from the default library view.
3. Users can switch to an Archived view and restore a prompt.
4. Users can permanently delete a prompt from the Archived view with confirmation.
5. Users can edit prompt `title` and `description` from the prompt detail view.
6. Search and list queries respect active vs archived filtering.

## Implementation Notes

- Added `prompts.archived_at` soft-delete column and archive-aware search RPC filtering.
- Implemented server actions for `archivePrompt`, `restorePrompt`, `deletePrompt`, and `updatePromptMetadata`.
- Added Active/Archived view toggle on the home page and passed view state through prompt list rendering.
- Extended prompt list context menu with lifecycle actions.
- Added inline metadata editing in `PromptDetail` (separate from content version editing).
- Fixed prompt selection synchronization when a prompt disappears from the active list after archive/delete.

## Verification

- `npx vitest run src/features/prompts/actions/manage-prompt.test.ts src/features/prompts/queries/get-prompts.test.ts src/features/search/actions.test.ts src/features/prompts/components/prompt-list.test.tsx src/features/prompts/components/prompt-detail.test.tsx src/features/prompts/components/prompts-container.test.tsx`

## File List

- `supabase/migrations/20260226000006_prompt_lifecycle_archive.sql`
- `src/lib/validation/prompt.ts`
- `src/features/prompts/actions/manage-prompt.ts`
- `src/features/prompts/actions/manage-prompt.test.ts`
- `src/features/prompts/queries/get-prompts.ts`
- `src/features/prompts/queries/get-prompts.test.ts`
- `src/features/prompts/types/index.ts`
- `src/features/prompts/components/prompt-list.tsx`
- `src/features/prompts/components/prompt-list.test.tsx`
- `src/features/prompts/components/prompts-container.tsx`
- `src/features/prompts/components/prompt-detail.tsx`
- `src/features/prompts/components/prompt-detail.test.tsx`
- `src/features/search/actions.ts`
- `src/features/search/actions.test.ts`
- `src/features/search/types.ts`
- `src/app/page.tsx`

Status: done
