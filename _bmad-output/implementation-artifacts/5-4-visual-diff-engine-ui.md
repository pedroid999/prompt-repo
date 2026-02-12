# Story 5.4: Visual Diff Engine & UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see a color-coded diff between two prompt versions,
so that I can understand exactly what changed and avoid making mistakes when restoring or modifying prompts.

## Acceptance Criteria

1. **Version Selection**: Users can select two versions from the History view to compare.
2. **Visual Diff Rendering**: A monospaced view highlights additions in Emerald (text-green-500, bg-green-500/10) and deletions in Rose (text-red-500, bg-red-500/10).
3. **Performance**: The diff is calculated client-side using the `diff` library for sub-16ms responsiveness.
4. **Keyboard Navigation**: Pressing `D` in the History view triggers the diff overlay; `Esc` closes it.
5. **UI Density**: The diff view is readable at 400px width using a "Unified Diff" (interleaved) layout.

## Tasks / Subtasks

- [x] **Library Integration & Setup**
  - [x] Ensure `diff` library (v8.0.3) is available.
  - [x] Create `DiffViewer` component in `src/features/prompts/components/diff-viewer.tsx`.
- [x] **Diff Logic & UI Implementation** (AC: 2, 3, 5)
  - [x] Implement client-side diff calculation using `diff.diffLines`.
  - [x] Render the "Unified Diff" with a 24px gutter for +/- symbols.
  - [x] Apply Kanagawa-themed highlights for additions and deletions.
  - [x] Ensure the layout is responsive and information-dense for 400px sidebar.
- [x] **History View Integration** (AC: 1, 4)
  - [x] Update `PromptHistory` component to allow selecting two versions for comparison.
  - [x] Implement `D` keyboard shortcut to open the diff overlay.
  - [x] Add `Esc` listener to close the overlay and return focus to the history list.
- [x] **Verification & Testing**
  - [x] Unit tests for diff calculation logic.
  - [x] Integration test: Select two versions -> Trigger Diff -> Verify presence of Emerald/Rose elements.

## Dev Notes

### Architecture Patterns
- **Client-Side Myers Algorithm**: Use the `diff` library on the client to avoid server round-trips for history comparisons.
- **Unified Diff Layout**: In 400px viewports, use a single-column interleaved diff rather than side-by-side to maintain legibility.
- **IntelliJ-style Gutter**: Use a dedicated vertical strip for +/- symbols to provide instant semantic clarity.

### Source Tree Components to Touch
- `src/features/prompts/components/diff-viewer.tsx` (New)
- `src/features/prompts/components/prompt-history.tsx` (Update for selection and shortcuts)
- `src/features/prompts/components/prompt-detail.tsx` (Coordinate diff state if needed)

### Testing Standards Summary
- Test `DiffViewer` rendering with different string inputs.
- Verify keyboard shortcut integration in `PromptHistory`.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Visual Diffing Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 5: The Analytical Deep-Dive]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4: Visual Diff Engine & UI]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References
- Handled newline differences in `diffLines` by normalizing line splitting in `calculateDiff`.
- Implemented `D` shortcut with check for active input elements to avoid accidental triggering while typing.
- Used `Dialog` for high-focus overlay as per PRD requirements.

### Completion Notes List
- Installed `diff` v8.0.3.
- Created `calculateDiff` utility for line-by-line comparison with robust newline handling.
- Implemented `DiffViewer` component with Kanagawa highlights (Emerald for additions, Rose for deletions).
- Enhanced `PromptHistory` with version selection (max 2) and comparison trigger via button or `D` key.
- Added comprehensive unit tests for diff logic and component tests for history interactions.

### File List
- `src/features/prompts/utils/diff.ts`
- `src/features/prompts/utils/diff.test.ts`
- `src/features/prompts/components/diff-viewer.tsx`
- `src/features/prompts/components/prompt-history.tsx`
- `src/features/prompts/components/prompt-history.test.tsx`
