# Story 5.1: Snapshot Database Schema & RLS

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to implement the `prompt_snapshots` table with strict RLS,
so that users can securely save their resolution states.

## Acceptance Criteria

1.  **Database Migration**: A new migration file is created for the `prompt_snapshots` table.
2.  **Table Schema**: The table includes:
    - `id`: UUID (Primary Key)
    - `created_at`: Timestamptz (default: now())
    - `user_id`: UUID (Foreign Key to `auth.users`, NOT NULL)
    - `prompt_version_id`: UUID (Foreign Key to `prompt_versions`, NOT NULL, ON DELETE CASCADE)
    - `name`: Text (NOT NULL)
    - `variables`: JSONB (NOT NULL, default: '{}'::jsonb)
3.  **RLS Policies**: Row Level Security is enabled for `prompt_snapshots`.
4.  **Isolation**: Users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` their own snapshots based on `auth.uid()`.
5.  **Referential Integrity**: Snapshots are version-locked (referencing `prompt_version_id`) to ensure they remain valid even if the prompt is updated later.

## Tasks / Subtasks

- [x] **Database Migration (AC: 1, 2)**
  - [x] Create `supabase/migrations/20260208000004_prompt_snapshots.sql`.
  - [x] Define `prompt_snapshots` table structure with appropriate constraints and indices.
- [x] **Security & RLS (AC: 3, 4)**
  - [x] Enable RLS on `prompt_snapshots`.
  - [x] Implement `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies using `auth.uid()`.
- [x] **Verification (AC: 5)**
  - [x] Verify foreign key relationship to `prompt_versions`.
  - [x] Verify `jsonb` column for flexible variable storage.

## Dev Notes

### Architecture Patterns
- **Snapshot Storage Pattern: Version-Locked JSONB**: Snapshots are locked to `prompt_version_id` to ensure immutability and schema safety.
- **Naming Conventions**: Use `snake_case` for all table and column names.
- **Security**: Row Level Security (RLS) is mandatory for multi-tenant isolation.

### Source Tree Components to Touch
- `supabase/migrations/`: New migration file.
- `docs/verification/rls-isolation.md`: Updated with snapshot verification steps.
- `src/features/snapshots/types/`: New TypeScript definitions.

### Testing Standards Summary
- Ensure the migration runs cleanly in a local Supabase environment.
- Verify RLS policies by attempting cross-user access (should be blocked).
- Verify table structure via schema verification tests.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1: Snapshot Database Schema & RLS]
- [Source: _bmad-output/planning-artifacts/architecture.md#Snapshot Storage Pattern: Version-Locked JSONB]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] (Naming Patterns)

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References
- Migration created and verified against repo patterns.
- RLS policies implemented for select, insert, update, and delete.
- Indexes added for user_id and prompt_version_id.
- TypeScript types added for `prompt_snapshots`.
- RLS isolation documentation updated.

### Completion Notes List
- Created `supabase/migrations/20260208000004_prompt_snapshots.sql` (renamed for consistency).
- Table `prompt_snapshots` includes all required columns and constraints.
- RLS is enabled with per-user isolation.
- Version-locking is enforced via FK to `prompt_versions`.
- Added `PromptSnapshot` and `CreateSnapshotInput` types in `src/features/snapshots/types/index.ts`.
- Updated `docs/verification/rls-isolation.md` with Snapshot RLS verification steps.

### File List
- `supabase/migrations/20260208000004_prompt_snapshots.sql`
- `src/lib/supabase/schema-verify.test.ts`
- `src/features/snapshots/types/index.ts`
- `docs/verification/rls-isolation.md`

### Change Log
- 2026-02-11: Initial implementation of Snapshot database schema and RLS policies.
- 2026-02-11: Addressed code review findings: added TypeScript types, improved schema tests, updated RLS documentation, and renamed migration for consistency.

Status: done
