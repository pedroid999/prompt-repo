# Story 1.2: Database Foundation & Multi-tenant RLS

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to set up the base Supabase schema with strict RLS policies,
so that all user data is isolated and secure from the start.

## Acceptance Criteria

1. **Given** a new Supabase project
   **When** I deploy the initial migration with `auth.users` references
   **Then** Row Level Security (RLS) is enabled for all tables
2. **And** policies are created to ensure users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` their own records based on `auth.uid()`

## Tasks / Subtasks

- [x] Initialize Supabase Migration Structure (AC: #1)
  - [x] Create `supabase/migrations` directory
- [x] Create Initial Foundation Migration (AC: #1, #2)
  - [x] Implement `profiles` table with `id` (UUID, references `auth.users`), `display_name`, `avatar_url`, and `updated_at`
  - [x] Enable Row Level Security (RLS) on the `profiles` table
  - [x] Create `SELECT` policy: Users can view their own profile
  - [x] Create `INSERT` policy: Users can insert their own profile
  - [x] Create `UPDATE` policy: Users can update their own profile
- [x] Implement Automatic Profile Creation (AC: #1)
  - [x] Create a PostgreSQL function to handle new user signups
  - [x] Create a trigger on `auth.users` to call the function on `INSERT`
- [x] Verify RLS Isolation (AC: #2)
  - [x] Document manual verification steps for RLS policies

### Review Follow-ups (AI)
- [x] [AI-Review][High] Added missing DELETE policy for profiles (AC: #2)
- [x] [AI-Review][Medium] Secured `handle_new_user` function with `SET search_path = public`
- [x] [AI-Review][Medium] Added `updated_at` trigger for `profiles` table
- [ ] [AI-Review][Medium] Implement automated RLS tests (Requires DB test environment)

## Dev Notes

- **Naming Convention:** Use `snake_case` for all database tables and columns (e.g., `updated_at`, `display_name`).
- **RLS Pattern:** Use `auth.uid() = id` for row-level isolation.
- **Multi-tenancy:** In this project, multi-tenancy is handled at the user level (each user is their own "tenant").
- **Security:** Ensure the `service_role` key is never used in client-side code.

### Project Structure Notes

- Migrations should be stored in `supabase/migrations/` using timestamped or sequential naming (e.g., `20240208000000_init_foundation.sql`).
- Alignment with `src/lib/supabase` for client interaction.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: Database Foundation & Multi-tenant RLS]

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References
- N/A (SQL migration implementation)

### Completion Notes List
- Created `supabase/migrations` directory.
- Implemented `20260208000000_init_foundation.sql` containing the `profiles` table, RLS enablement, and policies (SELECT, INSERT, UPDATE, DELETE).
- Added a PostgreSQL function `handle_new_user()` (secured with `SET search_path = public` and metadata fallback) and a trigger `on_auth_user_created` to automatically create profiles on signup.
- Added `handle_updated_at()` function (secured with `SET search_path = public`) and trigger for the `profiles` table.
- Created a verification document `docs/verification/rls-isolation.md` detailing the steps for manual RLS testing (cleaned up post-review).

### File List
- supabase/migrations/20260208000000_init_foundation.sql
- docs/verification/rls-isolation.md
- _bmad-output/implementation-artifacts/1-2-database-foundation-multi-tenant-rls.md

### Change Log
- 2026-02-08: Initial implementation of database foundation and RLS policies.
