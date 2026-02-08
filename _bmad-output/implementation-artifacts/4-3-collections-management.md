# Story 4.3: Collections Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to organize my prompts into custom Collections,
So that I can group related assets for different projects or workflows.

## Acceptance Criteria

1.  **Collection CRUD**: Users can create, rename, and delete Collections (e.g., "Email Drafts", "Coding Helpers").
2.  **Association**: Users can add a prompt to one or more collections and remove it.
3.  **Isolation**: Users can ONLY see and manage their own collections (Strict RLS).
4.  **Filtering**: Selecting a collection in the sidebar filters the prompt list to show only prompts in that collection.
5.  **Uniqueness**: Collection names must be unique per user.
6.  **Persistence**: Associations are saved in the database (PostgreSQL).
7.  **UI Feedback**: Optimistic updates for adding/removing items; visual indication of active filters.

## Tasks / Subtasks

- [x] **Database: Schema & RLS**
    - [x] Create `collections` table (`id`, `user_id`, `name`, `description`, `created_at`, `updated_at`).
    - [x] Create `collection_prompts` join table (`collection_id`, `prompt_id`, `added_at`).
    - [x] Enable RLS on both tables.
    - [x] Add Policies: `SELECT`, `INSERT`, `UPDATE`, `DELETE` for owner (`auth.uid()`).
    - [x] Add unique index on `collections(user_id, name)`.
- [x] **Feature: Collections Backend (Server Actions)**
    - [x] Implement `createCollection(data)` (Zod validated).
    - [x] Implement `deleteCollection(id)`.
    - [x] Implement `addToCollection(promptId, collectionId)`.
    - [x] Implement `removeFromCollection(promptId, collectionId)`.
    - [x] Implement `getCollections()` (cached).
- [x] **UI: Sidebar & Navigation**
    - [x] Create `CollectionList` component for the sidebar.
    - [x] Create `CreateCollectionDialog` (Shadcn Dialog + Form).
    - [x] Update `PromptList` to accept `collectionId` filter.
- [x] **UI: Prompt Management**
    - [x] Add "Add to Collection" option in Prompt Card context menu.
    - [ ] Add "Manage Collections" in Prompt Detail view (optional/nice-to-have).
- [ ] **Integration & Testing**
    - [ ] Verify RLS (try to access another user's collection).
    - [ ] Verify filtering performance.
    - [ ] Unit tests for Server Actions.

## Dev Notes

### Architecture Patterns
-   **Schema**: Normalized M:N relationship with `collections` and `collection_prompts`.
-   **State**: URL-driven state for filtering (`?collectionId=...`) to ensure shareability and history.
-   **Optimistic UI**: Use `useOptimistic` or `revalidatePath` appropriately for immediate feedback.
-   **Naming**: `collections` table, `src/features/collections` folder.

### Source Tree Components to Touch
-   `supabase/migrations/` (New migration file required)
-   `src/features/collections/` (New feature folder)
    -   `actions.ts`
    -   `schemas.ts`
    -   `components/collection-list.tsx`
    -   `components/create-collection-dialog.tsx`
-   `src/app/layout.tsx` (Update to include `CollectionList` in Sidebar)
-   `src/app/page.tsx` (Update `searchPrompts` or `getPrompts` to handle `collectionId`)

### Technical Requirements
-   **RLS**: `collection_prompts` must verify that the user owns the collection (and implicitly the prompt).
    -   Policy for `collection_prompts`:
        ```sql
        USING (
          exists (
            select 1 from collections c
            where c.id = collection_id
            and c.user_id = auth.uid()
          )
        )
        ```
-   **Performance**: Add index on `collection_prompts(prompt_id)` and `collection_prompts(collection_id)`.

### References
-   [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3: Collections Management]
-   [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (via BMAD create-story workflow)

### Debug Log References
- Extracted requirement FR13 from Epics.
- Designed Two-Table schema extension (`collections` + `collection_prompts`).
- Defined RLS strategy for join table.
- Planned UI integration points (Sidebar, URL state).

### Completion Notes List
- [ ] Created migration file.
- [ ] Implemented server actions.
- [ ] Added UI components.
- [ ] Verified RLS.
- Implemented Collections Schema and RLS policies (Migration 20260208000003).
- Implemented Server Actions (`create`, `delete`, `add`, `remove`, `get`) with Zod validation.
- Implemented `CollectionList` sidebar component and `CreateCollectionDialog`.
- Updated `layout.tsx` to include Sidebar.
- Updated `page.tsx` and `getPrompts` to support collection filtering.
- Updated `PromptList` to include Context Menu for adding prompts to collections.
- Added comprehensive unit tests for actions and query logic.
- Verified all 88 tests pass.
- [Review Fix] Implemented `updateCollection` server action (Rename).
- [Review Fix] Added `EditCollectionDialog` and Delete confirmation in Sidebar Context Menu.
- [Review Fix] Added "Manage Collections" in Prompt List context menu (Toggle/Remove support).
- [Review Fix] Updated `getPrompts` to return `collection_ids` for UI state.
- [Review Fix] Verified 91 tests pass.

### File List
- `supabase/migrations/20260208000003_collections.sql`
- `src/features/collections/schemas.ts`
- `src/features/collections/actions.ts`
- `src/features/collections/actions.test.ts`
- `src/features/collections/components/create-collection-dialog.tsx`
- `src/features/collections/components/edit-collection-dialog.tsx`
- `src/features/collections/components/collection-list.tsx`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/features/prompts/types/index.ts`
- `src/features/prompts/queries/get-prompts.ts`
- `src/features/prompts/queries/get-prompts.test.ts`
- `src/features/prompts/components/prompt-list.tsx`
- `src/features/prompts/components/prompts-container.tsx`
