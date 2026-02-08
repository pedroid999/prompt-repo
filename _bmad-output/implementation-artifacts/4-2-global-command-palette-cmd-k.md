# Story 4.2: Global Command Palette (Cmd+K)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to navigate and search my library using a keyboard-first command palette,
so that I can maintain my flow state without touching the mouse.

## Acceptance Criteria

1. **Global Trigger**: Pressing `Cmd+K` (or `Ctrl+K`) anywhere in the application opens the command palette.
2. **Fuzzy Search**: Typing in the palette filters the list of prompts using fuzzy matching (reusing `searchPrompts` logic).
3. **Keyboard Navigation**: Users can navigate the results list using arrow keys and select a prompt with `Enter`.
4. **Action Context**: Selecting a prompt from the palette opens it in the library view (or navigates to its detail page).
5. **UI Consistency**: The palette follows the Kanagawa theme (Dragon background, Crystal Blue highlights) and Geist Mono typography for results.
6. **Performance**: The palette opens and filters results in < 50ms for a local list of prompts.

## Tasks / Subtasks

- [x] **Infrastructure: Shadcn Command Component**
  - [x] Install `cmdk` and `lucide-react`.
  - [x] Scaffold `src/components/ui/command.tsx` (using shadcn-ui pattern).
- [x] **Feature: Command Palette Component**
  - [x] Create `src/components/features/search/command-palette.tsx`.
  - [x] Implement `useEventListener` or similar hook to capture `Cmd+K`.
  - [x] Integrate `searchPrompts` Server Action (or a client-side filter if library is pre-loaded).
- [x] **Integration: Global Provider**
  - [x] Wrap `src/app/layout.tsx` with a client-side wrapper to mount the `CommandPalette` globally.
  - [x] Ensure the palette is accessible from any page (Library, Profile, etc.).
- [x] **Verification & Testing**
  - [x] Verify keyboard-only navigation (Search -> Select -> Open).
  - [x] Verify focus management (Palette should trap focus when open and return focus when closed).
  - [x] Check performance on a list of 50+ prompts.

## Dev Notes

### Architecture Patterns
- **Command Component**: Built on top of `cmdk`. This is a client-side component by nature.
- **Theming**: Must use Kanagawa colors (`#1F1F28` background, `#7E9CD8` highlights).
- **Typography**: Geist Mono for result titles and descriptions.

### Source Tree Components to Touch
- `src/components/ui/command.tsx` (New)
- `src/components/features/search/command-palette.tsx` (New)
- `src/app/layout.tsx` (Modified)
- `src/features/search/actions.ts` (Already existing, may need adjustment for the palette)

### Testing Standards
- Manual verification of keyboard flow is critical.
- Ensure no "Z-index wars" with other overlays or toasts.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows]

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (via BMAD create-story workflow)

### Debug Log References
- Ultimate context engine analysis completed - comprehensive developer guide created.
- Researched shadcn/ui command palette best practices (cmdk, keyboard traps, focus management).
- Identified layout integration point in `src/app/layout.tsx`.
- Implemented `CommandPalette` with async search integration.
- Updated routing logic to support deep linking to prompts via `?id=`.

### Completion Notes List
- Installed `cmdk` and `lucide-react`.
- Implemented `src/components/ui/command.tsx` and `src/components/ui/dialog.tsx`.
- Implemented `src/components/features/search/command-palette.tsx` with async server-side search.
- Updated `src/app/layout.tsx` to mount `CommandPalette` globally.
- Updated `src/app/page.tsx` and `PromptsContainer` to support prompt selection via URL ID.
- Added comprehensive unit tests for new components.
- Fixed regressions in `searchActions` tests.
- **Code Review Fixes:**
    - Updated navigation to preserve existing URL params (except `id`).
    - Added prompt description to search results.
    - Applied `font-mono` globally to Command Palette inputs and items.
    - Used constant `SEARCH_DEBOUNCE_MS`.

### File List
- `src/components/ui/command.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/features/search/command-palette.tsx`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/features/prompts/components/prompts-container.tsx`
- `src/components/ui/command.test.tsx`
- `src/components/features/search/command-palette.test.tsx`
- `src/features/search/actions.test.ts`
- `vitest.setup.ts`
- `package.json`
- `package-lock.json`

