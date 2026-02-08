# Story 2.1: prompt-database-schema-two-table-pattern

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to implement the two-table prompt schema in PostgreSQL,
so that I can separate active prompt data from immutable version history for performance and integrity.

## Acceptance Criteria

1. **Given** a Supabase database
   **When** I run the migration for `prompts` and `prompt_versions` tables
   **Then** the `prompts` table stores current metadata (ID, Title, Description, UserID)
2. **And** the `prompt_versions` table stores immutable content and version notes
3. **And** strict `snake_case` is used for all column names per architectural standards
4. **And** Row Level Security (RLS) is enabled for both tables with multi-tenant isolation (auth.uid() = user_id)

## Tasks / Subtasks

- [x] Create Migration: `supabase/migrations/20260208000001_prompt_schema.sql` (AC: #1)
- [x] Implement `prompts` table (AC: #1, #3)
  - [x] Columns: `id` (UUID, primary key), `user_id` (UUID, references `profiles.id`), `title` (text), `description` (text), `created_at`, `updated_at`
- [x] Implement `prompt_versions` table (AC: #2, #3)
  - [x] Columns: `id` (UUID, primary key), `prompt_id` (UUID, references `prompts.id`, ON DELETE CASCADE), `version_number` (int), `content` (text), `version_note` (text), `created_at`
- [x] Enable RLS and Set Policies (AC: #4)
  - [x] Enable RLS on `prompts` and `prompt_versions`
  - [x] `prompts` policies: SELECT, INSERT, UPDATE, DELETE (Users own their prompts)
  - [x] `prompt_versions` policies: SELECT, INSERT (History is immutable; no UPDATE/DELETE)
- [x] Add `updated_at` trigger for `prompts` table
- [x] Verify RLS Isolation
  - [x] Add manual verification steps to `docs/verification/rls-isolation.md` (or similar)

## Dev Notes

- **Architecture Pattern:** Two-Table (HEAD + History). `prompts` acts as the pointer/metadata, `prompt_versions` stores the content.
- **Constraints:**
  - `snake_case` is mandatory for database entities.
  - `prompt_versions` must be treated as immutable once inserted.
- **RLS:** Policies must ensure `auth.uid() = user_id` for `prompts`. For `prompt_versions`, use a join or check `prompt_id` against `prompts.user_id`.

### Project Structure Notes

- Migrations are sequential in `supabase/migrations/`.
- This story provides the data foundation for Epic 2 (CRUD and Versioning).

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: Prompt Database Schema (Two-Table Pattern)]
- [Source: supabase/migrations/20260208000000_init_foundation.sql]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

- Verified existing tests pass with `npm test`.
- Created SQL migration for `prompts` and `prompt_versions`.
- Updated RLS isolation documentation.

### Completion Notes List

- Created `supabase/migrations/20260208000001_prompt_schema.sql`.
- Implemented `prompts` table with `updated_at` trigger.
- Implemented `prompt_versions` table with immutable policy.
- Enabled RLS with multi-tenant isolation on both tables.
- Updated `docs/verification/rls-isolation.md` with new verification steps.
- **Code Review Fixes:**
  - Added indexes on `prompts(user_id)` and `prompt_versions(prompt_id)` for RLS performance.
  - Added unique constraint on `prompt_versions(prompt_id, version_number)` for data integrity.

### File List

- supabase/migrations/20260208000001_prompt_schema.sql
- docs/verification/rls-isolation.md
- src/lib/supabase/schema-verify.test.ts

## Change Log

- 2026-02-08: Initial implementation of prompt database schema and RLS policies.
- 2026-02-08: Applied code review fixes (indexes and unique constraints).
