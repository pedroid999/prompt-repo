# Story 2.4: Version History & Restoration

## Review Follow-ups (AI)

- [x] [AI-Review][High] Acceptance Criteria Implementation Gap: HEAD version clarity. [src/features/prompts/components/prompt-history.tsx]
- [x] [AI-Review][High] AC5 Accessibility/Responsive Violation: Theme consistency and padding. [src/features/prompts/components/prompts-container.tsx]
- [x] [AI-Review][Medium] Security/Optimization: Broad revalidation for home page. [src/features/prompts/actions/restore-version.ts]
- [x] [AI-Review][Medium] Race Condition in Tab Switching: Stale response handling. [src/features/prompts/components/prompt-detail.tsx]
- [x] [AI-Review][Medium] Error Handling: Failure state in history fetch. [src/features/prompts/queries/get-prompt-history.ts, src/features/prompts/components/prompt-detail.tsx]

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to view the chronological history of a prompt and restore a previous version,
so that I can recover from mistakes or revert to "golden" versions.

## Acceptance Criteria

1. **Given** a prompt with multiple versions
   **When** I open the "History" tab
   **Then** I see a vertical timeline of versions with their notes and timestamps
2. **And** each version entry shows the version number, note, and relative time (e.g., "2 hours ago")
3. **And** clicking "Restore" on an old version creates a NEW version with that content (HEAD remains immutable)
4. **And** the timeline uses Kanagawa styling and Geist Mono for any code/content snippets
5. **And** the history view remains fully functional at 400px width (NFR4)

## Tasks / Subtasks

- [x] Create History Component: `src/features/prompts/components/prompt-history.tsx` (AC: #1, #2, #4)
  - [x] Implement vertical timeline UI using Kanagawa colors (Dragon background, Crystal Blue accents)
  - [x] Display version number, note, and relative timestamp
  - [x] Add "Restore" button for each historical version
- [x] Implement Restore Action: `src/features/prompts/actions/restore-version.ts` (AC: #3)
  - [x] Create a new Server Action to handle restoration
  - [x] Fetch historical content and insert as a NEW version in `prompt_versions`
  - [x] Revalidate the prompt detail page after restoration
- [x] Update Prompt Detail View: `src/features/prompts/components/prompt-detail.tsx`
  - [x] Add a "History" tab or collapsible section to the detail view
  - [x] Integrate the `PromptHistory` component
- [x] Implement Data Fetching for History: `src/features/prompts/queries/get-prompt-history.ts`
  - [x] Fetch all versions for a specific prompt ID ordered by `version_number` descending
- [x] Add Tests: `src/features/prompts/components/prompt-history.test.tsx`
  - [x] Verify rendering of timeline entries
  - [x] Mock restore action and verify it is called with correct parameters

## Dev Notes

- **Architecture Pattern:** Feature-based components in `src/features/prompts/components/`. Mutations via Server Actions in `src/features/prompts/actions/`.
- **Immutability:** The system MUST NOT delete or update existing versions. Restoration is implemented by copying the content of a historical version into a brand-new version record with an incremented version number.
- **UX Strategy:** Use a node-based vertical timeline as described in the UX spec. Active version should be highlighted.
- **Performance:** History fetch should be efficient. Consider limiting initial load if history is extremely long (though not expected for MVP).

### Project Structure Notes

- Keep `PromptHistory` as a sub-component of the prompts feature.
- Use `lucide-react` for timeline icons (e.g., `History`, `RotateCcw`) if already available in the project.

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4: Version History & Restoration]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

- Verified Kanagawa colors using CSS variables from globals.css.
- Implemented `getRelativeTime` helper to avoid external dependencies.
- Confirmed strict immutability by creating new versions on restore.

### Completion Notes List

- Implemented `PromptHistory` component with vertical timeline and Kanagawa styling.
- Created `restoreVersion` Server Action that safely creates a new version from historical content.
- Updated `PromptDetail` to include a History tab that fetches versions on demand.
- Implemented `getPromptHistory` query to fetch versions securely.
- Updated `PromptsContainer` to sync UI when underlying data changes (e.g. after restore).
- Added comprehensive unit tests for `PromptHistory` and `PromptDetail` (interaction).

### File List

- `src/features/prompts/components/prompt-history.tsx`
- `src/features/prompts/components/prompt-history.test.tsx`
- `src/features/prompts/actions/restore-version.ts`
- `src/features/prompts/components/prompt-detail.tsx`
- `src/features/prompts/components/prompt-detail.test.tsx`
- `src/features/prompts/queries/get-prompt-history.ts`
- `src/features/prompts/components/prompts-container.tsx`