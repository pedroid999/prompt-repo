# Story 3.3: Real-time Resolved Preview

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see a live preview of my resolved prompt as I type into the form fields,
so that I am confident in the final output before copying.

## Acceptance Criteria

1. **Given** I am typing in the dynamic resolution form
   **When** I update a field value
   **Then** a monospaced preview block updates in real-time (<16ms) to show the final resolved string
2. **And** the preview uses the **Geist Mono** font (via `font-mono`)
3. **And** the preview respects the **Kanagawa** theme styling (e.g., Dragon background, Fuji text)
4. **And** the preview handles line breaks and whitespace correctly (`whitespace-pre-wrap`)

## Tasks / Subtasks

- [x] Create `ResolvedPreview` Component (AC: #1, #2, #3, #4)
  - [x] File: `src/features/resolution-engine/components/resolved-preview.tsx`
  - [x] Props: `content: string` (template), `values: Record<string, string>`
  - [x] Logic: Replace `{{key}}` in `content` with values from `values` map. Handle missing values gracefully (show original tag or empty).
  - [x] Style: `font-mono`, `whitespace-pre-wrap`, `rounded-md`, theme-aware colors (muted background).
- [x] Integrate with `ResolutionForm` (AC: #1)
  - [x] Modify `src/features/resolution-engine/components/resolution-form.tsx`
  - [x] Use `useWatch` from `react-hook-form` to capture current form values in real-time.
  - [x] Render `ResolvedPreview` below or alongside the form fields.
- [x] Unit Tests
  - [x] File: `src/features/resolution-engine/components/resolved-preview.test.tsx`
  - [x] Test variable substitution logic.
  - [x] Test handling of undefined/empty values.

## Dev Notes

- **Architecture:** Keep within `src/features/resolution-engine`.
- **Performance:** `useWatch` is the standard way to subscribe to form changes in `react-hook-form`. Ensure it doesn't cause excessive re-renders of unrelated components.
- **Styling:** Use `bg-muted` or similar Shadcn utility class which should map to the Kanagawa theme if configured correctly in `globals.css` / `tailwind.config.ts`.
- **UX:** The preview should be "What You See Is What You Copy".

### Project Structure Notes

- New Component: `src/features/resolution-engine/components/resolved-preview.tsx`
- Modified Component: `src/features/resolution-engine/components/resolution-form.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: Real-time Resolved Preview]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

- Encountered a test failure in `ResolutionForm` integration test due to empty string vs placeholder expectation.
- Updated `ResolvedPreview` logic to fallback to the placeholder tag if the value is an empty string, improving UX.
- Verified all tests pass with `npx vitest run src/features/resolution-engine/`.
- Note: `eslint` and `tsc` binaries in `node_modules` seem broken in the current environment, but tests confirm functionality.

### Completion Notes List

- Implemented `ResolvedPreview` component with real-time variable substitution.
- Integrated preview into `ResolutionForm` using `useWatch` for performance.
- Added comprehensive unit tests covering substitution logic and integration.
- Ensured styling matches Kanagawa theme requirements (font-mono, bg-muted).

### File List
- src/features/resolution-engine/components/resolved-preview.tsx
- src/features/resolution-engine/components/resolved-preview.test.tsx
- src/features/resolution-engine/components/resolution-form.tsx
- src/features/resolution-engine/components/resolution-form.test.tsx
- src/lib/utils/variable-parser.ts

### Code Review Improvements
- **Fix:** Corrected falsy value bug in `ResolvedPreview` (now handles `0` correctly).
- **Optimization:** Refactored `ResolutionForm` to use isolated `useWatch` in `LiveResolvedPreview` to prevent full form re-renders on keystroke.
- **Refactor:** Centralized regex logic in `variable-parser.ts`.
- **UX:** Changed preview behavior to show empty string instead of placeholder when value is empty (WYSIWYC).
- **Fix:** Replaced brittle `setTimeout` focus management with robust `autoFocus` prop.

