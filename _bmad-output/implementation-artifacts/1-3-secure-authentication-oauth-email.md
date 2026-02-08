# Story 1.3: Secure Authentication (OAuth & Email)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to sign in via GitHub, Google, or Email,
so that I can securely access my private prompt library.

## Acceptance Criteria

1. **Given** I am on the `/auth/login` page
   **When** I select GitHub/Google OAuth or enter my email/password
   **Then** I am authenticated via Supabase SSR and redirected to the main library page
2. **And** a secure session cookie is established via Next.js middleware
3. **And** I can sign out to invalidate my session

## Tasks / Subtasks

- [x] Create Auth Layout and Login Page (AC: #1)
  - [x] Implement `src/app/auth/login/page.tsx` with Email/Password and OAuth buttons
  - [x] Style with Kanagawa theme and Shadcn components
- [x] Implement OAuth Sign-in Logic (AC: #1)
  - [x] Configure GitHub/Google providers in Supabase client calls
- [x] Implement Email/Password Sign-in Logic (AC: #1)
  - [x] Create server action or route handler for email/password authentication
- [x] Create OAuth Callback Route (AC: #1)
  - [x] Implement `src/app/auth/callback/route.ts` to handle code exchange
- [x] Implement Middleware for Session Refresh and Protection (AC: #2)
  - [x] Create `src/middleware.ts` to refresh Supabase sessions and protect private routes
- [x] Add Logout Functionality (AC: #3)
  - [x] Implement logout button/action to clear session cookies
- [x] Verify Authentication Flow (AC: #1, #2, #3)
  - [x] Test end-to-end login/logout with all supported methods

## Dev Notes

- **Supabase SSR:** Use `createServerClient` in middleware and route handlers, and `createBrowserClient` in client components.
- **Next.js 15:** Leverage Server Actions for form submissions.
- **Middleware:** Essential for keeping the session alive in Next.js App Router.
- **Security:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used for client-side, but keep secrets server-side.
- **Theme:** Kanagawa Dragon (`#1f1f28`) background, Fuji (`#dcd7ba`) text, Crystal Blue (`#7e9cd8`) interactive elements.

### Project Structure Notes

- Auth routes should be under `src/app/auth/`.
- Middleware should be at `src/middleware.ts`.
- Reusable auth components (if any) in `src/components/shared/auth/`.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: Secure Authentication (OAuth & Email)]
- [Source: src/lib/supabase/server.ts]
- [Source: src/lib/supabase/client.ts]

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References
- Successfully ran `npm test` passing all 14 tests.
- Fixed `CardTitle` accessibility issue by adding `role="heading"`.
- Fixed `createClient` mock to return object synchronously.
- Implemented `signOut` action and `SignOutButton` component.

### Code Review Fixes (2026-02-08)

- **Security:** Implemented `src/app/auth/auth-error/page.tsx` to handle authentication failures gracefully.

- **Security:** Added strict validation for the `next` parameter in `src/app/auth/callback/route.ts` to prevent open redirect vulnerabilities.

- **UX:** Updated `src/app/auth/login/page.tsx` to display error messages from URL parameters using an Alert component.

- **UX:** Added `SubmitButton` with `useFormStatus` to show "Signing In..." state during form submission.

- **Performance:** Refactored `src/lib/supabase/middleware.ts` to optimize cookie handling and avoid redundant `NextResponse` creation.

- **Quality:** Fixed type definition in `src/lib/supabase/server.ts` to correctly handle Next.js 15 async `cookies()`.

- **Accessibility:** Added `aria-label` to Google OAuth button SVG.



### Completion Notes List

- Implemented `src/app/auth/login/page.tsx` with Kanagawa-styled login form using Server Actions.

- Implemented OAuth (GitHub, Google) and Email/Password authentication in `src/app/auth/actions.ts`.

- Created OAuth callback route at `src/app/auth/callback/route.ts`.

- Implemented secure middleware in `src/middleware.ts` and `src/lib/supabase/middleware.ts` to protect routes and refresh sessions.

- Created `SignOutButton` component and added it to the home page for easy testing.

- Added comprehensive unit/integration tests for all components and actions.



### File List

- src/app/auth/login/page.tsx

- src/app/auth/login/page.test.tsx

- src/app/auth/actions.ts

- src/app/auth/actions.test.ts

- src/app/auth/callback/route.ts

- src/app/auth/callback/route.test.ts

- src/app/auth/auth-error/page.tsx

- src/middleware.ts

- src/middleware.test.ts

- src/lib/supabase/middleware.ts

- src/lib/supabase/middleware.test.ts

- src/lib/supabase/server.ts

- src/components/shared/auth/sign-out-button.tsx

- src/components/shared/auth/sign-out-button.test.tsx

- src/components/shared/auth/submit-button.tsx

- src/components/ui/alert.tsx

- src/app/page.tsx

- package.json (devDependencies updated)
