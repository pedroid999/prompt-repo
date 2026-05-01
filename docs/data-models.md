# Data Models & Database Schema

PostgreSQL schema (managed by Supabase). All migrations live in `supabase/migrations/` and are applied locally with `npx supabase db reset`.

## 1. Migration timeline

| # | File | Date | What it does |
|---|------|------|--------------|
| 0 | `20260208000000_init_foundation.sql` | 2026-02-08 | `profiles` table, `handle_updated_at` trigger, `handle_new_user` trigger that auto-creates a `profiles` row on `auth.users` insert. |
| 1 | `20260208000001_prompt_schema.sql` | 2026-02-08 | `prompts` (HEAD) + `prompt_versions` (immutable history). Versions table has no `UPDATE`/`DELETE` policies — history is append-only. |
| 2 | `20260208000002_search_index.sql` | 2026-02-08 | `prompts.search_tokens` (`tsvector`), GIN index, weighted FTS triggers, first version of `search_prompts(...)` RPC. |
| 3 | `20260208000003_collections.sql` | 2026-02-08 | `collections` and `collection_prompts` join table. |
| 4 | `20260208000004_prompt_snapshots.sql` | 2026-02-08 | `prompt_snapshots` (point-in-time captures with bound variable values). |
| 5 | `20260208000005_update_search_rpc.sql` | 2026-02-08 | Adds `latest_version_id` and the collection-aware filter to `search_prompts` RPC. |
| 6 | `20260226000006_prompt_lifecycle_archive.sql` | 2026-02-26 | `prompts.archived_at` soft-delete column + `(user_id, archived_at)` index + archive-aware `search_prompts` RPC. |
| 7 | `20260227000007_prompt_public_sharing.sql` | 2026-02-27 | `prompts.is_public` flag + public-read RLS policy + partial index on `is_public = true`. |
| 8 | `20260301000008_user_api_keys.sql` | 2026-03-01 | `user_api_keys` for MCP bearer-token auth. Stores `key_hash` only, never plaintext. |
| 9 | `20260314000009_user_ai_providers.sql` | 2026-03-14 | `user_ai_providers` (cloud + Ollama) with `pgcrypto` extension and `pgp_sym_encrypt_text` / `pgp_sym_decrypt_text` SECURITY DEFINER RPCs. |

## 2. Entity-relationship diagram

```
auth.users (Supabase managed)
    │   1:1
    ▼
profiles (id, display_name, avatar_url, updated_at)
    │   1:N (only prompts FK references profiles; everything else FKs auth.users)
    ▼
prompts ──────────────────────────────────────────┐
  ├─ id, user_id, title, description              │
  ├─ created_at, updated_at                       │
  ├─ search_tokens (tsvector, weighted FTS)        │
  ├─ archived_at (soft-delete)                    │
  └─ is_public (public-share flag)                │
                                                  │
            1:N (immutable, append-only)          │
            ▼                                     │ N:M
       prompt_versions                            ▼
         ├─ id, prompt_id, version_number         collection_prompts
         ├─ content, version_note                 (collection_id, prompt_id)
         └─ created_at                            ▲
              │                                   │
              │ 1:N                               │
              ▼                                   │
         prompt_snapshots                         │
           ├─ id, user_id, prompt_version_id      │
           ├─ name                                │
           ├─ variables (JSONB)                   │
           └─ created_at, updated_at              │
                                                  │
auth.users ──────────────────────────────────────┤
   │                                              │
   ├─ 1:N ─► collections ◄──────────────────────┘
   │           ├─ id, user_id, name, description
   │           └─ unique(user_id, name)
   │
   ├─ 1:N ─► user_api_keys
   │           ├─ id, user_id, label
   │           ├─ key_hash (UNIQUE, indexed)
   │           ├─ created_at, revoked_at (soft-delete)
   │           └─ CHECK char_length(label) BETWEEN 1 AND 100
   │
   └─ 1:N ─► user_ai_providers
               ├─ id, user_id, provider ∈ {claude, openai, gemini, ollama}
               ├─ encrypted_api_key (pgcrypto, cloud only)
               ├─ endpoint_url (Ollama only)
               ├─ is_active
               └─ unique(user_id, provider)
```

## 3. Tables

### 3.1 `profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `display_name` | text | nullable; defaulted to `full_name` from OAuth metadata, falling back to local-part of email |
| `avatar_url` | text | nullable |
| `updated_at` | timestamptz | default `now()`, updated by `handle_updated_at` trigger |

- **RLS:** SELECT/INSERT/UPDATE/DELETE all gated by `auth.uid() = id`.
- **Triggers:** `on_profiles_updated` (BEFORE UPDATE) keeps `updated_at` fresh.
- **Auth integration:** `on_auth_user_created` (AFTER INSERT on `auth.users`) auto-provisions a profile row using `raw_user_meta_data->>'full_name'`/`avatar_url` (SECURITY DEFINER).

### 3.2 `prompts` — HEAD state

| Column | Type | Constraints | Added by |
|--------|------|-------------|----------|
| `id` | uuid | PK, default `gen_random_uuid()` | mig 1 |
| `user_id` | uuid | NOT NULL, **`REFERENCES profiles(id) ON DELETE CASCADE`** (note: not `auth.users` directly) | mig 1 |
| `title` | text | NOT NULL | mig 1 |
| `description` | text | nullable | mig 1 |
| `created_at` | timestamptz | default UTC `now()` | mig 1 |
| `updated_at` | timestamptz | default UTC `now()`, updated by trigger | mig 1 |
| `search_tokens` | tsvector | weighted FTS column | mig 2 |
| `archived_at` | timestamptz | nullable; non-null = archived | mig 6 |
| `is_public` | boolean | NOT NULL, default `false` | mig 7 |

- **Indexes:** `idx_prompts_user_id`, GIN `idx_prompts_search_tokens`, partial `idx_prompts_user_archived_at(user_id, archived_at)`, partial `idx_prompts_is_public WHERE is_public = true`.
- **RLS:**
  - Owner: `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE.
  - Public read: `is_public = true` for SELECT (including `anon` role) — Supabase ORs policies for the same operation.
- **Triggers:** `on_prompts_updated` (BEFORE UPDATE → `handle_updated_at`); `tr_prompts_search_update` (BEFORE INSERT/UPDATE OF title/description → recomputes `search_tokens`).
- **Lifecycle states:** `archived_at IS NULL AND is_public = false` (active private), `archived_at IS NULL AND is_public = true` (active shared), `archived_at IS NOT NULL` (archived; not surfaced in default search).

> ⚠ **Drift from planning architecture:** the planning `architecture.md` and `CLAUDE.md` describe a `latest_version_id` pointer column on `prompts`. **The current schema has no such column.** The "latest version" is computed at query time by `get_latest_prompt_version_id()` and `get_latest_prompt_content()` (mig 5). When implementing brownfield features that read the head version, use those SQL functions or `ORDER BY version_number DESC LIMIT 1` — do **not** assume a `latest_version_id` FK.

### 3.3 `prompt_versions` — immutable history

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `prompt_id` | uuid | NOT NULL, `REFERENCES prompts(id) ON DELETE CASCADE` |
| `version_number` | int | NOT NULL, unique within `(prompt_id, version_number)` |
| `content` | text | NOT NULL |
| `version_note` | text | nullable |
| `created_at` | timestamptz | default UTC `now()` |

- **Indexes:** `idx_prompt_versions_prompt_id`, unique `(prompt_id, version_number)`.
- **RLS:** SELECT and INSERT gated by `EXISTS (SELECT 1 FROM prompts WHERE id = prompt_versions.prompt_id AND user_id = auth.uid())`. **No `UPDATE` or `DELETE` policy** — versions are append-only by design. (Hard delete only happens implicitly via `prompts ON DELETE CASCADE`.)
- **Trigger:** `tr_prompt_versions_search_update` (AFTER INSERT) re-computes the parent prompt's `search_tokens` using the new content.

### 3.4 `prompt_snapshots`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `prompt_version_id` | uuid | NOT NULL, `REFERENCES prompt_versions(id) ON DELETE CASCADE` |
| `name` | text | NOT NULL |
| `variables` | jsonb | NOT NULL, default `'{}'::jsonb` |
| `created_at` / `updated_at` | timestamptz | default UTC `now()` |

- **Indexes:** `idx_prompt_snapshots_user_id`, `idx_prompt_snapshots_prompt_version_id`.
- **RLS:** all four operations gated by `auth.uid() = user_id`.
- **Use case:** captures a `(prompt_version, bound variables)` pair so a resolved prompt can be re-hydrated later (resolution-engine + visual diff).

### 3.5 `collections` + `collection_prompts`

`collections`:

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `name` | text | NOT NULL, **unique within `(user_id, name)`** |
| `description` | text | nullable |
| `created_at` / `updated_at` | timestamptz | default `now()` |

`collection_prompts` (join):

| Column | Type | Constraints |
|--------|------|-------------|
| `collection_id` | uuid | PK part, `REFERENCES collections(id) ON DELETE CASCADE` |
| `prompt_id` | uuid | PK part, `REFERENCES prompts(id) ON DELETE CASCADE` |
| `added_at` | timestamptz | default `now()` |

- **Indexes:** `idx_collection_prompts_prompt_id`, `idx_collection_prompts_collection_id`.
- **RLS:** `collections` use `auth.uid() = user_id`. `collection_prompts` use a parent-collection EXISTS check (read & insert & delete; no update policy is defined since the row has no mutable columns).

### 3.6 `user_api_keys` — MCP bearer auth

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `label` | text | NOT NULL, `CHECK char_length(label) BETWEEN 1 AND 100` |
| `key_hash` | text | NOT NULL, **UNIQUE** |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `revoked_at` | timestamptz | nullable; non-null = revoked (soft-delete) |

- **Indexes:** UNIQUE `idx_user_api_keys_key_hash` (used on every MCP request to look up the caller), `idx_user_api_keys_user_id` (profile listing).
- **RLS:** all four operations gated by `auth.uid() = user_id`. The MCP `verifyApiKey` path uses the **service-role** client (bypasses RLS) and applies an explicit `revoked_at IS NULL` predicate.
- **Security model:** plaintext API key generated and returned **once** by `createApiKey`. Only the SHA-256 hash is persisted. See `src/lib/api-keys/{generate, hash, verify}.ts`.

### 3.7 `user_ai_providers` — encrypted provider config

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `provider` | text | NOT NULL, `CHECK provider IN ('claude','openai','gemini','ollama')` |
| `encrypted_api_key` | text | nullable, but required for cloud providers (see CHECK below) |
| `endpoint_url` | text | nullable, but required for Ollama (see CHECK below) |
| `is_active` | boolean | NOT NULL, default `true` |
| `created_at` / `updated_at` | timestamptz | NOT NULL, default `now()` |

- **Constraints:** `UNIQUE(user_id, provider)`; `chk_provider_credentials` enforces "cloud → encrypted_api_key NOT NULL; Ollama → endpoint_url NOT NULL".
- **Indexes:** `idx_user_ai_providers_user_id`.
- **RLS:** all four operations gated by `auth.uid() = user_id`.
- **Trigger:** `trg_user_ai_providers_updated_at` (BEFORE UPDATE → bumps `updated_at`).
- **Encryption pipeline:**
  - `pgcrypto` extension installed in `extensions` schema.
  - `pgp_sym_encrypt_text(plaintext, passphrase)` and `pgp_sym_decrypt_text(ciphertext, passphrase)` declared `SECURITY DEFINER` with locked-down `search_path`.
  - The application calls these via `supabase.rpc(...)` from `src/lib/crypto/provider-keys.ts`, so plaintext only ever exists in the TLS payload to Supabase, never in the wire columns.

## 4. Functions & RPCs

| Function | Stability | Purpose |
|----------|-----------|---------|
| `handle_updated_at()` | trigger | Bumps `updated_at` to `now()` on row updates. Used by `profiles`, `prompts`, `prompt_snapshots`. |
| `handle_new_user()` | trigger | Creates a `profiles` row when a `auth.users` row is inserted. SECURITY DEFINER, search_path locked to `public`. |
| `update_prompt_search_tokens_trigger()` | trigger | Recomputes weighted `tsvector` for `prompts.search_tokens`. Fires before INSERT/UPDATE on `prompts` and after INSERT on `prompt_versions`. |
| `get_latest_prompt_content(p_id uuid)` | STABLE | Returns the content of the highest `version_number` for a prompt. |
| `get_latest_prompt_version_id(p_id uuid)` | STABLE | Returns the id of the highest `version_number` for a prompt. |
| `search_prompts(query_text, filter_user_id, filter_collection_id, filter_archived)` | STABLE | Postgres FTS RPC. Returns `(id, user_id, title, description, archived_at, created_at, updated_at, latest_content, latest_version_id, rank)`. Applies prefix-matching by appending `:*` to each lexeme. |
| `update_user_ai_providers_updated_at()` | trigger | Bumps `updated_at` on `user_ai_providers`. |
| `pgp_sym_encrypt_text(plaintext, passphrase)` | SECURITY DEFINER | RPC wrapper around `pgp_sym_encrypt`. |
| `pgp_sym_decrypt_text(ciphertext, passphrase)` | SECURITY DEFINER | RPC wrapper around `pgp_sym_decrypt`. |

### Search-token weighting

The trigger composes a weighted tsvector:

```sql
setweight(to_tsvector('english', title), 'A')
|| setweight(to_tsvector('english', description), 'B')
|| setweight(to_tsvector('english', content), 'C')
```

Title matches outrank description matches, which outrank body content matches.

### Search RPC — prefix matching

```sql
SELECT string_agg(lexeme || ':*', ' & ')::tsquery
FROM unnest(to_tsvector('english', query_text));
```

Each lexeme of the query gets `:*` appended for "starts-with" matching, then they're combined with `&`. Empty/whitespace queries short-circuit to no rows.

## 5. Foreign-key inconsistency (worth flagging)

- `prompts.user_id` → **`profiles(id)`**
- `prompt_snapshots.user_id`, `collections.user_id`, `user_api_keys.user_id`, `user_ai_providers.user_id` → **`auth.users(id)`**

Functionally equivalent because `profiles.id` is itself an FK to `auth.users(id)` and the `handle_new_user` trigger guarantees a 1:1 mapping. But it means the cascade chain for `prompts` is two hops (`auth.users → profiles → prompts`) while everything else is one hop. If you ever introduce features that join across user-owned tables, the FK target mix is something to be aware of.

## 6. Row Level Security — invariants

| Invariant | Enforced by |
|-----------|-------------|
| A user can only see/modify their own data on every user-scoped table | RLS policies using `auth.uid() = user_id` |
| Public prompts are readable by anyone, including `anon` role | `is_public = true` policy on `prompts` |
| Prompt history is append-only | Absence of UPDATE/DELETE policies on `prompt_versions` |
| Service-role MCP code must apply `user_id` filters explicitly | Convention: every tool handler in `src/features/mcp/tools/*` joins on `user_id = userId OR is_public = true` |

The end-to-end RLS isolation regression test is documented in `docs/verification/rls-isolation.md`.

## 7. Generating TypeScript types

Generated DB types are not committed to the repo. To regenerate locally:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

Currently the codebase relies on `@supabase/supabase-js` inferred types and the hand-written types under `src/features/*/types.ts`.
