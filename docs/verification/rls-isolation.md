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

## 5. Verify `DELETE` Isolation
**Goal:** Ensure users cannot delete other users' profiles.
*Note: Currently no DELETE policy is explicitly created in migration 20260208000000, which means DELETE is denied by default if RLS is enabled.*

**Steps:**
1. Authenticate as User A.
2. Execute: `DELETE FROM public.profiles WHERE id = [USER_B_ID]`.
3. **Success Criteria:** Zero rows are deleted and User B's record remains.
