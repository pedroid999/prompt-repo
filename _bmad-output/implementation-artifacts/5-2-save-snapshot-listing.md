# Story 5.2: Save Snapshot & Listing

Status: done

## Senior Developer Review (AI)
- **Broken Server Action**: Fixed `saveSnapshot` calling `createClient()` without cookies.
- **Architectural Violation**: Fixed `getSnapshots` being called from client while being a server utility; converted to Server Action.
- **Broken Optimistic UI**: Fixed missing `onSnapshotSaved` prop destructuring in `ResolutionForm`.
- **Invalid Revalidation**: Corrected revalidation path from `/prompts` to `/`.
- **Code Quality**: Cleaned up excessive spacing in `get-prompts.ts`.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to save a "Snapshot" of my current resolution variables,
so that I can reuse them later.

## Acceptance Criteria

1.  **Save Snapshot Action**: A "Save Snapshot" button or `Cmd+S` shortcut is available in the Resolution Mode.
2.  **Snapshot Naming**: Clicking "Save Snapshot" opens a dialog to name the snapshot.
3.  **Persistence**: The current variable state (`jsonb`), name, and `prompt_version_id` are saved to the `prompt_snapshots` table via a Server Action.
4.  **Snapshot Listing**: A list of saved snapshots for the specific prompt is visible (e.g., in a sidebar or dropdown within the resolution view).
5.  **Optimistic UI**: The snapshot list updates immediately upon saving.

## Tasks / Subtasks

- [x] **Snapshot Feature Foundation**
  - [x] Create `src/features/snapshots/` directory.
  - [x] Define Zod schemas and Types for Snapshots.
- [x] **Backend Implementation (AC: 3)**
  - [x] Create `src/features/snapshots/actions.ts` with `saveSnapshot` Server Action.
  - [x] Create `src/features/snapshots/queries.ts` to fetch snapshots for a prompt version.
- [x] **UI Implementation (AC: 1, 2, 4, 5)**
  - [x] Implement `SaveSnapshotDialog` component in `src/features/snapshots/components/`.
  - [x] Add "Save Snapshot" button and `Cmd+S` listener to `ResolutionForm`.
  - [x] Implement `SnapshotList` component to display snapshots for the current prompt.
  - [x] Integrate `SnapshotList` into the Prompt Detail or Resolution view.

## Dev Notes

### Architecture Patterns
- **Server Actions**: Use for all data mutations.
- **JSONB Storage**: The `variables` field in `prompt_snapshots` stores the form state as a JSON object.
- **Keyboard Shortcuts**: `Cmd+S` for saving snapshots as per UX constraints.

### Source Tree Components to Touch
- `src/features/snapshots/` (New feature folder).
- `src/features/resolution-engine/components/resolution-form.tsx` (Add save trigger).
- `src/features/prompts/components/prompt-detail.tsx` (Integrate snapshot list).

### Testing Standards Summary
- Unit test for `saveSnapshot` action.
- Component test for `SaveSnapshotDialog`.
- Integration test for the saving flow.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2: Save Snapshot & Listing]
- [Source: _bmad-output/planning-artifacts/architecture.md#Snapshot Storage Pattern: Version-Locked JSONB]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] (Cmd+S shortcut)

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References
- Implemented `saveSnapshot` Server Action with Zod validation.
- Implemented `getSnapshots` query.
- Created `SaveSnapshotDialog` and `SnapshotList` components.
- Integrated snapshots into `ResolutionForm` and `PromptDetail`.
- Added `Cmd+S` keyboard shortcut for saving snapshots.
- Updated `getPrompts` and `search_prompts` RPC to include `latest_version_id`.

### Completion Notes List
- Feature-driven organization in `src/features/snapshots/`.
- `SaveSnapshotDialog` provides naming UI and calls the Server Action.
- `SnapshotList` displays saved snapshots and allows one-click resolution and copy.
- Keyboard listeners for `Cmd+Enter` (Copy) and `Cmd+S` (Save Snapshot) enhance flow velocity.
- Optimistic refresh implemented via `refreshKey` in `PromptDetail`.

### File List
- `src/features/snapshots/actions.ts`
- `src/features/snapshots/actions.test.ts`
- `src/features/snapshots/queries.ts`
- `src/features/snapshots/types/index.ts`
- `src/features/snapshots/components/save-snapshot-dialog.tsx`
- `src/features/snapshots/components/snapshot-list.tsx`
- `src/features/resolution-engine/components/resolution-form.tsx`
- `src/features/prompts/components/prompt-detail.tsx`
- `src/features/prompts/queries/get-prompts.ts`
- `src/features/prompts/types/index.ts`
- `src/features/search/types.ts`
- `src/lib/validation/snapshot.ts`
- `supabase/migrations/20260208000005_update_search_rpc.sql`

Status: done
