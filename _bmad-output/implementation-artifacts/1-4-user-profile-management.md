# Story 1.4: User Profile Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to view and update my basic profile information,
so that I can manage my identity within the application.

## Acceptance Criteria

1. **Given** I am an authenticated user
   **When** I navigate to the profile section
   **Then** I see my current display name and avatar URL
2. **When** I update my display name or avatar URL and save
   **Then** the changes are saved to the Supabase `profiles` table
3. **And** the UI reflects the updates immediately using optimistic UI patterns
4. **And** the profile page follows the Kanagawa theme (Dragon background, Fuji text, Crystal Blue highlights) and uses Geist Mono for content

## Tasks / Subtasks

- [x] Create Profile Server Actions (AC: #2)
  - [x] Implement `getProfile` to fetch the current user's profile from the `profiles` table
  - [x] Implement `updateProfile` action to update `display_name` and `avatar_url`
- [x] Create Profile Page (AC: #1, #4)
  - [x] Implement `src/app/profile/page.tsx` (Server Component) to fetch initial data
  - [x] Implement `src/components/features/profile/profile-form.tsx` (Client Component) with `react-hook-form` and `zod`
- [x] Style Profile UI (AC: #4)
  - [x] Use Shadcn `Card`, `Input`, `Label`, and `Button` components
  - [x] Ensure `Geist Mono` is used for form inputs
- [x] Implement Optimistic UI / Feedback (AC: #3)
  - [x] Use `useActionState` or `useOptimistic` for immediate feedback
  - [x] Show a "Spring Green" toast or message on successful update
- [x] Add Profile Link to Home (AC: #1)
  - [x] Update `src/app/page.tsx` to include a link to the profile page
- [x] Verify Profile Management (AC: #1, #2, #3, #4)
  - [x] Add unit tests for `updateProfile` action
  - [x] Add component tests for `ProfileForm`

## Dev Notes

### Architecture Patterns & Constraints
- **Database:** The `profiles` table already exists with RLS policies (`auth.uid() = id`).
- **Auth:** Users must be authenticated (handled by middleware).
- **Naming:** Database uses `snake_case` (`display_name`, `avatar_url`), but frontend should map these to `camelCase` where appropriate (though Server Actions can handle `FormData` directly).
- **Theme:** Kanagawa Dark.
  - Background: `--background` (`#1f1f28`)
  - Text: `--foreground` (`#dcd7ba`)
  - Primary/Buttons: `--primary` (`#7e9cd8`)
- **Typography:** `font-mono` (`Geist Mono`) for inputs and code-like content.

### Project Structure Notes
- Actions should go in `src/app/profile/actions.ts` or a shared `src/lib/actions/profile.ts`. Given current patterns, `src/app/profile/actions.ts` is preferred.
- Components should go in `src/components/features/profile/`.
- Validation schemas should go in `src/lib/validation/profile.ts`.

### Testing Standards
- Use `vitest` and `@testing-library/react`.
- Mock Supabase clients using `vi.mock('@/lib/supabase/server')`.
- Follow patterns in `src/app/auth/actions.test.ts`.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: User Profile Management]
- [Source: supabase/migrations/20260208000000_init_foundation.sql]

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References
- Tests passed: `src/app/profile/actions.test.ts` and `src/components/features/profile/profile-form.test.tsx` pass.
- Fixed `toast.success` expectation to check for style object.
- Fixed mock chain for `supabase.from().update().eq().select().single()`.
- Fixed `TypeError` in `actions.test.ts` regarding Zod validation result access.
- Fixed `ProfileForm` test expectations for toast notifications.

### Completion Notes List
- Implemented `getProfile` and `updateProfile` in `src/app/profile/actions.ts` using Server Actions.
- Created `ProfileForm` using `react-hook-form`, `zod`, and Shadcn components (`Card`, `Input`, `Form`).
- Implemented form validation schema in `src/lib/validation/profile.ts`.
- Added toast notifications (`sonner`) for success/error feedback with "Spring Green" success color.
- Created `src/app/profile/page.tsx` server component to fetch initial profile data and protect the route.
- Added "Profile" button to `src/app/page.tsx` for navigation.
- Added comprehensive tests for actions and components.
- **Code Review Fixes:**
  - Implemented `startTransition` and `useOptimistic` in `ProfileForm` for true optimistic UI updates (AC #3).
  - Added proper Zod validation in `updateProfile` server action to prevent invalid data injection (Security).
  - Added Avatar preview in `ProfileForm` to satisfy "see my... avatar URL" AC more fully (AC #1).
  - Sanitized server error messages to prevent information leakage.
  - Updated tests to cover validation and optimistic UI scenarios.

### File List
- src/app/profile/actions.ts
- src/app/profile/actions.test.ts
- src/app/profile/page.tsx
- src/components/features/profile/profile-form.tsx
- src/components/features/profile/profile-form.test.tsx
- src/lib/validation/profile.ts
- src/components/ui/form.tsx
- src/components/ui/sonner.tsx
- src/app/page.tsx