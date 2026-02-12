# Story 5.3: Snapshot Re-resolution (Hydration)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to select a snapshot and have the resolution form pre-filled,
so that I can copy the resolved prompt instantly without re-typing common variables.

## Acceptance Criteria

1. **Snapshot Selection**: Users can select a saved snapshot from the list (implemented in 5.2).
2. **Form Hydration**: Selecting a snapshot hydrates the Resolution Engine's form fields with the saved `jsonb` values in < 50ms (NFR9).
3. **Immediate Preview**: The monospaced preview block updates immediately to show the resolved string using the hydrated values.
4. **Visual Feedback**: A "Snapshot Applied" toast notification appears when the form is hydrated.

## Tasks / Subtasks

- [x] **Hydration Logic Implementation** (AC: 2)
  - [x] Implement `hydrateResolutionForm` utility in `src/features/resolution-engine/utils/hydration.ts`.
  - [x] Ensure it handles missing or extra variables gracefully (merging snapshot values with default empty values).
- [x] **UI Integration** (AC: 1, 3, 4)
  - [x] Update `SnapshotList` to trigger an `onSelect` callback.
  - [x] Connect `SnapshotList` selection to the `ResolutionForm` via `PromptDetail`.
  - [x] Implement `form.reset()` logic in `ResolutionForm` when new values are provided via props or callback.
  - [x] Add toast notification "Snapshot Applied" using `sonner`.
- [x] **Verification & Testing**
  - [x] Unit test for `hydrateResolutionForm`.
  - [x] Integration test: Select snapshot -> Check form values -> Check preview text.
  - [x] Performance check: Measure hydration time < 50ms.

## Dev Notes

### Architecture Patterns
- **Hydration Boundary**: All Snapshot data must pass through `src/features/resolution-engine/utils/hydration.ts` before being applied to the UI state as per `architecture.md`.
- **State Management**: `ResolutionForm` uses `react-hook-form`. Use `form.reset(values)` for hydration to ensure the UI and preview (via `useWatch`) update correctly.
- **Latency**: Optimization for NFR9 (< 50ms).

### Source Tree Components to Touch
- `src/features/resolution-engine/utils/hydration.ts` (New)
- `src/features/snapshots/components/snapshot-list.tsx` (Add `onSelect` prop)
- `src/features/resolution-engine/components/resolution-form.tsx` (Add hydration support)
- `src/features/prompts/components/prompt-detail.tsx` (Coordinate selection)

### Testing Standards Summary
- Unit tests in `src/features/resolution-engine/utils/hydration.test.ts`.
- Integration tests in `src/features/resolution-engine/components/resolution-form.test.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3: Snapshot Re-resolution (Hydration)]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 4: The Snapshot Shortcut]
- [Source: _bmad-output/planning-artifacts/architecture.md#Snapshot Hydration Boundary]
- [Source: _bmad-output/planning-artifacts/architecture.md#Non-Functional Requirements Coverage] (NFR9)

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References
- Fixed ReferenceError by destructuring `initialValues` in `ResolutionForm`.
- Verified hydration logic with unit and integration tests.

### Completion Notes List
- Implemented `hydrateResolutionForm` utility to merge snapshot values with prompt variables.
- Added `initialValues` prop to `ResolutionForm` for hydration support.
- Updated `SnapshotList` to support `onSelect` callback and added "Apply to Form" button.
- Integrated hydration flow in `PromptDetail` to connect snapshots with the resolution form.
- Added comprehensive tests for hydration utility and form integration.

### File List
- `src/features/resolution-engine/utils/hydration.ts`
- `src/features/resolution-engine/utils/hydration.test.ts`
- `src/features/resolution-engine/components/resolution-form.tsx`
- `src/features/snapshots/components/snapshot-list.tsx`
- `src/features/prompts/components/prompt-detail.tsx`
- `src/features/resolution-engine/components/resolution-form.test.tsx`
