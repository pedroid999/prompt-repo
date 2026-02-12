# RLS Isolation Verification - Story 1.2

This document outlines the manual verification steps to ensure that Row Level Security (RLS) is correctly isolating user data in the `profiles` table.

## 1. Verify Profile Creation on Signup
**Goal:** Ensure a profile is automatically created when a new user signs up.

**Steps:**
1. Sign up a new user via Supabase Auth (or via SQL: `INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com')`).
2. Query the `profiles` table: `SELECT * FROM public.profiles WHERE id = [NEW_USER_ID]`.
3. **Success Criteria:** A record exists in `profiles` with the matching ID.

## 2. Verify `SELECT` Isolation
**Goal:** Ensure users can only see their own profile.

**Steps:**
1. Authenticate as User A.
2. Execute: `SELECT * FROM public.profiles`.
3. **Success Criteria:** Only User A's profile is returned.
4. Execute: `SELECT * FROM public.profiles WHERE id = [USER_B_ID]`.
5. **Success Criteria:** Zero rows are returned.

## 3. Verify `INSERT` Isolation
**Goal:** Ensure users cannot insert profiles for other users.

**Steps:**
1. Authenticate as User A.
2. Execute: `INSERT INTO public.profiles (id, display_name) VALUES ([USER_B_ID], 'Impersonator')`.
3. **Success Criteria:** The operation fails with a "new row violates row-level security policy" error.

## 4. Verify `UPDATE` Isolation
**Goal:** Ensure users cannot update other users' profiles.

**Steps:**
1. Authenticate as User A.
2. Execute: `UPDATE public.profiles SET display_name = 'Hacker' WHERE id = [USER_B_ID]`.
3. **Success Criteria:** The operation succeeds (0 rows affected) or fails with an error depending on the exact policy implementation, but User B's record remains unchanged.

## 6. Verify `prompt_snapshots` Isolation
**Goal:** Ensure users can only access their own snapshots.

**Steps:**
1. Authenticate as User A.
2. Insert a snapshot: `INSERT INTO public.prompt_snapshots (user_id, prompt_version_id, name, variables) VALUES (auth.uid(), [VERSION_ID], 'My Snapshot', '{}')`.
3. **Success Criteria:** The record is created.
4. Try to SELECT User B's snapshots: `SELECT * FROM public.prompt_snapshots WHERE user_id = [USER_B_ID]`.
5. **Success Criteria:** Zero rows are returned.
6. Try to UPDATE User B's snapshot name: `UPDATE public.prompt_snapshots SET name = 'Hacked' WHERE user_id = [USER_B_ID]`.
7. **Success Criteria:** Zero rows affected.
8. Try to DELETE User B's snapshot: `DELETE FROM public.prompt_snapshots WHERE user_id = [USER_B_ID]`.
9. **Success Criteria:** Zero rows affected.

