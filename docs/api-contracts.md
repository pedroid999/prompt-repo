# API Contracts

This document inventories every server-side entry point exposed by the application: HTTP route handlers, OAuth callbacks, the JSON-RPC MCP endpoint, and **Server Actions**, which the codebase uses as the primary mutation channel instead of REST API routes. All paths are relative to `src/`.

## 1. HTTP route handlers (App Router)

| Method | Path | Handler | Auth | Purpose |
|--------|------|---------|------|---------|
| `GET` | `/auth/callback?code=…&next=…` | `app/auth/callback/route.ts` | OAuth code | Exchanges Supabase OAuth/Email-confirmation `code` for a session, then redirects to a **same-origin-validated** `next` (defaults to `/`). On failure → `/auth/auth-error`. |
| `POST` | `/api/mcp` | `app/api/mcp/route.ts` | API key (`Authorization: Bearer …` or `x-api-key: …`) — **no session cookie** | JSON-RPC 2.0 dispatcher for the MCP server. Anonymous callers (no key) receive public prompts only. |
| `OPTIONS` | `/api/mcp` | `app/api/mcp/route.ts` | none | CORS preflight. Allows `POST, OPTIONS` and headers `Content-Type, Authorization, x-api-key`. |

**Middleware exclusion:** `src/middleware.ts` runs `updateSession` for every request **except** `_next/static`, `_next/image`, `favicon.ico`, and image extensions. The MCP route is excluded from the **session redirect** logic inside `lib/supabase/middleware.ts` so that API-key callers aren't bounced to `/auth/login` (see CLAUDE.md note).

## 2. Page routes (Server Component pages)

| Path | File | Auth | Notes |
|------|------|------|-------|
| `/` | `app/page.tsx` | session required | Home / prompt list |
| `/auth/login` | `app/auth/login/page.tsx` | public | Login + signup form |
| `/auth/auth-error` | `app/auth/auth-error/page.tsx` | public | Generic auth failure landing |
| `/p/[promptId]` | `app/p/[promptId]/page.tsx` | **public, no session** | Read-only public prompt link. Excluded from session redirect in middleware. |
| `/profile` | `app/profile/page.tsx` | session required | Profile + API keys + AI provider settings |
| `/prompts/create` | `app/prompts/create/page.tsx` | session required | Create-prompt form |

## 3. JSON-RPC MCP API (`POST /api/mcp`)

The MCP endpoint speaks **JSON-RPC 2.0** and always responds with **HTTP 200** — errors are carried inside the envelope's `error` object.

### 3.1 Authentication

```
Authorization: Bearer <api_key>     # preferred
x-api-key: <api_key>                # fallback
```

Plaintext keys are validated in `lib/api-keys/verify.ts` against the SHA-256 hash stored in `user_api_keys.key_hash`. If the key is missing → anonymous (public-only). If the key is present but invalid/revoked → `error.code = -32001 INVALID_API_KEY`.

### 3.2 Methods

| Method | Status | Maps to |
|--------|--------|---------|
| `initialize` | lifecycle | `handleInitialize` — returns static capabilities |
| `tools/list` | lifecycle | `handleListTools` — returns the 4-tool catalogue |
| `tools/call` | dispatch | Routes by `params.name` to one of the four prompt tools, wraps the result in `{ content: [{type: 'text', text: …}], isError: false }` |
| `prompts/list` | legacy alias | `handleListPrompts` (kept for backwards compatibility) |
| `prompts/get` | legacy alias | `handleGetPrompt` |
| `prompts/resolve` | legacy alias | `handleResolvePrompt` |
| `prompts/search` | legacy alias | `handleSearchPrompts` |

### 3.3 Tool catalogue (returned by `tools/list`)

| Tool | Required params | Optional params | Result shape |
|------|-----------------|-----------------|--------------|
| `list_prompts` | — | `limit` (1–100, default 20), `offset` (≥0, default 0) | `{ prompts: { id, title, description, variables[] }[] }` |
| `get_prompt` | `prompt_id: uuid` | — | `{ id, title, description, content, variables[] }` |
| `resolve_prompt` | `prompt_id: uuid` | `variables: { [k]: string }` | `{ id, title, resolved_content }` (un-supplied vars are left as `{{name}}`) |
| `search_prompts` | `query: string (min 1)` | `limit` (1–50, default 10) | `{ prompts: MCPPromptEntry[] }` |

### 3.4 Error codes

| Code | Constant | Meaning |
|------|----------|---------|
| `-32700` | `PARSE_ERROR` | Body is not valid JSON |
| `-32600` | `INVALID_REQUEST` | Body fails JSON-RPC envelope schema |
| `-32601` | `METHOD_NOT_FOUND` | Method or tool name not in dispatch map |
| `-32602` | `INVALID_PARAMS` | `tools/call` missing `name`, etc. |
| `-32603` | `INTERNAL_ERROR` | Unexpected server-side throw |
| `-32001` | `INVALID_API_KEY` | API key supplied but invalid or revoked |
| `-32002` | `PROMPT_NOT_FOUND` | Tool handler signalled a missing/forbidden prompt |

### 3.5 Implementation pointers

- Route: `src/app/api/mcp/route.ts`
- Dispatcher: `src/features/mcp/dispatcher.ts`
- Tool handlers: `src/features/mcp/tools/{initialize, list-tools, list-prompts, get-prompt, resolve-prompt, search-prompts}.ts`
- Types: `src/features/mcp/types.ts`
- Envelope schema: `src/lib/validation/mcp.ts`
- Service-role Supabase client (used by all tool handlers): `src/lib/supabase/service.ts`

## 4. Server Actions (the primary mutation surface)

The codebase uses Next.js Server Actions for all authenticated mutations. Every action below is `'use server'` and authenticates via session cookies through `lib/supabase/server.ts` (`createClient(cookies())`). A typical action shape:

```ts
1. createClient(cookieStore)
2. supabase.auth.getUser()  → reject if no user
3. zod.safeParse(input)     → reject if invalid
4. supabase.<table>.<op>()  → RLS authorises by user_id
5. revalidatePath(...)      → invalidate cached pages
6. return { success | data, error? }
```

Result envelopes are inconsistent across modules — most return discriminated unions `{ success: true, data } | { success: false, error }`, but the older `auth/actions.ts` and `collections/actions.ts` use redirects or `{ data | error }` without a `success` field.

### 4.1 Authentication — `app/auth/actions.ts`

| Action | Input | Effect |
|--------|-------|--------|
| `signInWithGithub()` | — | OAuth redirect to GitHub; callback to `/auth/callback` |
| `signInWithGoogle()` | — | OAuth redirect to Google; callback to `/auth/callback` |
| `signInWithEmail(formData)` | `email`, `password` | Email/password sign-in; redirect to `/` on success or `/auth/login?error=…` |
| `signUpWithEmail(formData)` | `email`, `password` | Sign-up + email confirmation flow; redirect to `/auth/login?message=…` |
| `signOut()` | — | Sign out; redirect to `/auth/login` |

### 4.2 Profile — `app/profile/actions.ts`

| Action | Input | Effect |
|--------|-------|--------|
| `getProfile()` | — | Reads `profiles` row for the current user |
| `updateProfile(formData)` | `display_name`, `avatar_url?` (validated by `profileSchema`) | Updates `profiles`, revalidates `/profile` |

### 4.3 Prompts — `features/prompts/actions/*.ts`

| Action | File | Tables touched | Notes |
|--------|------|----------------|-------|
| `savePrompt(input)` | `save-prompt.ts` | `prompts`, `prompt_versions` | Creates HEAD row + version 1. Manual rollback if version insert fails. Validated by `promptCreateSchema`. |
| `saveNewVersion(promptId, input)` | `save-new-version.ts` | `prompt_versions`, `prompts` | Reads max `version_number`, inserts `n+1`, bumps `prompts.updated_at`. Inline Zod schema (content max 20 000 chars, version_note max 200). |
| `restoreVersion(promptId, versionId)` | `restore-version.ts` | `prompt_versions`, `prompts` | Inserts a *new* version cloning the historical content with `version_note = "Restored from v{N}"`. |
| `archivePrompt(promptId)` | `manage-prompt.ts` | `prompts.archived_at` | Sets `archived_at = now()` if currently null. |
| `restorePrompt(promptId)` | `manage-prompt.ts` | `prompts.archived_at` | Clears `archived_at`. |
| `deletePrompt(promptId)` | `manage-prompt.ts` | `prompts` | Hard delete (relies on FK cascades for versions/snapshots). |
| `togglePromptPublic(promptId, isPublic)` | `manage-prompt.ts` | `prompts.is_public` | Drives `/p/[promptId]` access. |
| `updatePromptMetadata(promptId, input)` | `manage-prompt.ts` | `prompts.title`, `prompts.description`, `prompts.updated_at` | Validated by `promptMetadataSchema`. |
| `duplicatePrompt(promptId)` | `duplicate-prompt.ts` | `prompts`, `prompt_versions` | Creates `Copy of {title}` with v1 cloning latest version content. |

### 4.4 Collections — `features/collections/actions.ts`

| Action | Tables | Effect |
|--------|--------|--------|
| `createCollection(input)` | `collections` | Insert; `revalidatePath('/prompts')` |
| `getCollections()` | `collections` | Read all (RLS scopes to user) |
| `updateCollection(id, input)` | `collections` | Update name/description |
| `deleteCollection(id)` | `collections` | Delete (cascade-removes `collection_prompts`) |
| `addToCollection(promptId, collectionId)` | `collection_prompts` | Junction row insert |
| `removeFromCollection(promptId, collectionId)` | `collection_prompts` | Junction row delete |

### 4.5 Search — `features/search/actions.ts`

| Action | DB call | Notes |
|--------|---------|-------|
| `searchPrompts(query, options?)` | `supabase.rpc('search_prompts', { query_text, filter_user_id, filter_collection_id, filter_archived })` | Postgres FTS RPC. Empty query short-circuits to `{ data: [], error: null }`. Validates `query` (1–500 chars), `userId/collectionId` (uuid), `archived` (boolean). |

### 4.6 Snapshots — `features/snapshots/actions.ts`

| Action | Tables | Notes |
|--------|--------|-------|
| `saveSnapshot(input)` | `prompt_snapshots` | Validates `input` against `snapshotSchema`, attaches `user_id`, revalidates `/`. |

(Read-side queries live in `features/snapshots/queries.ts`.)

### 4.7 API Keys — `features/api-keys/actions.ts`

| Action | Tables | Notes |
|--------|--------|-------|
| `createApiKey(label)` | `user_api_keys` | Generates random plaintext key + SHA-256 hash; **plaintext returned exactly once** in the response, never persisted. Caps at **10 active keys per user**. |
| `listApiKeys()` | `user_api_keys` | Selects `id, user_id, label, created_at, revoked_at` (never `key_hash`). |
| `revokeApiKey(keyId)` | `user_api_keys.revoked_at` | Idempotent: returns `success: true` even if already revoked. RLS-equivalent guard via `.eq('user_id', user.id)`. |

### 4.8 AI Providers — `features/ai-providers/actions.ts`

| Action | Tables | Notes |
|--------|--------|-------|
| `saveProvider(input)` | `user_ai_providers` (upsert on `(user_id, provider)`) | Cloud providers (`claude`, `openai`, `gemini`): API key encrypted via `lib/crypto/provider-keys.ts` (pgcrypto) before insert. Ollama: only `endpoint_url` stored. |
| `deleteProvider(input)` | `user_ai_providers` | Validates via `deleteProviderSchema`. |
| `toggleProvider(input)` | `user_ai_providers.is_active` | Validates via `toggleProviderSchema`. |

### 4.9 AI Composer — `features/ai-composer/actions.ts`

| Action | External call | Notes |
|--------|---------------|-------|
| `structurePrompt({ brainstormText, provider, model? })` | Provider adapter (`createProvider(...)` → Claude / OpenAI / Gemini / Ollama) | Loads + decrypts the user's provider config via `getProviderConfig`, calls `adapter.structure()` with `STRUCTURING_SYSTEM_PROMPT`. Translates timeout / 401 / 429 / `ECONNREFUSED` errors into user-friendly messages. |
| `listOllamaModels(endpointUrl)` | Ollama `/api/tags` (via `OllamaAdapter.listModels`) | Stateless probe that does not require a saved provider — UI can validate before save. |

## 5. Cross-cutting concerns

### Authorisation model

- **Session-cookie endpoints** (all server actions, page routes): use `createClient(cookieStore)` from `lib/supabase/server.ts`. Authorization is enforced by **PostgreSQL RLS policies**, not by application code. Most actions still call `supabase.auth.getUser()` first to short-circuit with `Unauthorized`, but the database is the source of truth.
- **API-key endpoints** (only `/api/mcp`): use `createServiceClient()` from `lib/supabase/service.ts` (service-role, bypasses RLS). Authorization is enforced by **`userId` filtering in the tool handlers** — every tool query must scope to `user_id = userId OR is_public = true`. This is a critical invariant; see `docs/verification/rls-isolation.md` for the regression test plan.
- **Public sharing** (`/p/[promptId]`): uses the **anon** client and reads the prompt only when `is_public = true`. RLS allows anon-role reads on this column.

### Validation conventions

- Zod v4 schemas live in `src/lib/validation/*.ts` (centralised) **or** co-located in feature folders (`features/collections/schemas.ts`, inline in `save-new-version.ts`). The mix is current state — there is no single convention enforced.
- Server Actions return `safeParse` issues as a single concatenated error string in most modules; some return the first issue's message only.

### Cache invalidation

Most mutations call `revalidatePath('/')` or `revalidatePath('/profile')`. There is **no use of `revalidateTag`** and no shared cache-key convention — paths are hard-coded.

### Known inconsistencies (call out for refactor)

- Result envelope shapes vary: `{ success, data?, error? }` (newer modules) vs. `{ data, error }` (`collections`) vs. plain `redirect(...)` (`auth`).
- `searchPrompts` server action and the `search_prompts` MCP tool share the underlying `search_prompts` Postgres RPC but do their own validation in parallel.
- `duplicatePrompt` and `savePrompt` both implement manual rollback by deleting the prompt if the version insert fails. This logic should ideally live in a Postgres function or a transaction.
