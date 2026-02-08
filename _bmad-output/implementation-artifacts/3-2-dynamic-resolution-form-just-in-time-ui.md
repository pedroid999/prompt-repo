# Story 3.2: Dynamic Resolution Form (Just-in-Time UI)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the system to instantly generate an input form based on my prompt's variables,
so that I can customize the prompt without manual find-and-replace.

## Acceptance Criteria

1. **Given** I select a prompt with variables (e.g., `{{name}}`, `{{role}}`)
   **When** I enter "Resolution Mode" (or the variables are detected)
   **Then** a form appears with an input field for every detected unique variable
2. **And** the first field is automatically focused for immediate typing
3. **And** the form is managed via **React Hook Form** for sub-50ms performance (re-renders minimized)
4. **And** the inputs use the **Geist Mono** font (via `font-mono` class)
5. **And** I can navigate between fields using the `Tab` key
6. **And** the form handles dynamic variable lists (if the underlying prompt content changes, the form updates)

## Tasks / Subtasks

- [x] Scaffold Resolution Engine Feature (AC: #1)
  - [x] Create directory `src/features/resolution-engine/components`
  - [x] Create directory `src/features/resolution-engine/hooks` (if needed)
  - [x] Create directory `src/features/resolution-engine/types`
- [x] Create `ResolutionForm` Component (AC: #1, #3, #4, #5)
  - [x] File: `src/features/resolution-engine/components/resolution-form.tsx`
  - [x] Props: `content: string`, `onValuesChange?: (values: Record<string, string>) => void`
  - [x] Logic: Use `extractVariables` (from `src/lib/utils/variable-parser`) to get fields
  - [x] State: Initialize `useForm` with empty values or defaults
  - [x] UI: Render `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `Input` (shadcn/ui)
  - [x] Style: Apply `font-mono` to inputs
- [x] Implement Auto-Focus Logic (AC: #2)
  - [x] Use `useEffect` or `autoFocus` prop on the first input field
- [x] Integration with PromptDetail (AC: #1)
  - [x] Update `src/features/prompts/components/prompt-detail.tsx`
  - [x] Add a "Resolve" tab or toggle button
  - [x] Conditionally render `ResolutionForm` when in Resolve mode
  - [x] Pass `prompt.latest_content` to the form
- [x] Unit Tests (AC: #3)
  - [x] Create `src/features/resolution-engine/components/resolution-form.test.tsx`
  - [x] Test form generation with 0, 1, and multiple variables
  - [x] Test tab navigation and focus
  - [x] Test value updates

## Dev Notes

- **Architecture:** This belongs in `src/features/resolution-engine/`.
- **Performance:** `react-hook-form` is critical here to avoid full page re-renders on every keystroke. Use `watch` or `useWatch` carefully if passing data up.
- **Dependency:** Use the `extractVariables` utility created in Story 3.1 (`src/lib/utils/variable-parser.ts`).
- **Styling:** Adhere strictly to Shadcn UI patterns. Use `zinc` theme variables.
- **UX:** The "Just-in-Time" aspect means if `extractVariables(content)` returns an empty array, the form might show a message or not render. For now, render "No variables detected" or similar if empty, or handle gracefully.

### Project Structure Notes

- New Feature: `src/features/resolution-engine`
- Shared Utils: `src/lib/utils/variable-parser.ts`
- UI Components: `src/components/ui/` (Input, Form, Button, Label)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: Dynamic Resolution Form (Just-in-Time UI)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

- Scaffolded `src/features/resolution-engine` directories.
- Implemented `ResolutionForm` using `react-hook-form` and shadcn components.
- Integrated `ResolutionForm` into `PromptDetail` via a new "Resolve" tab.
- Refactored `src/components/ui/input.tsx` to use `forwardRef` for better compatibility with Radix UI Slot.
- Verified all tests pass (61/61).

### Completion Notes List

- Created `ResolutionForm` component which detects variables and generates inputs.
- Implemented auto-focus on the first field for high-velocity retrieval.
- Ensured `font-mono` is used for all variable inputs to match "Repo" aesthetic.
- Integrated the form into the main UI for "Just-in-Time" accessibility.

### File List

- `src/features/resolution-engine/components/resolution-form.tsx`
- `src/features/resolution-engine/components/resolution-form.test.tsx`
- `src/features/prompts/components/prompt-detail.tsx`
- `src/components/ui/input.tsx` (Refactored)
