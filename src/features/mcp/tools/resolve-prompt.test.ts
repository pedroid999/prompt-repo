import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleResolvePrompt } from './resolve-prompt';
import { MCP_ERROR_CODES } from '../types';

// ---------------------------------------------------------------------------
// Supabase mock builder
//
// The resolve-prompt handler calls:
//   supabase.from('prompts').select(...).eq('id', prompt_id).maybeSingle()
// ---------------------------------------------------------------------------

function buildQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };

  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(resolvedValue);

  return chain;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_USER_ID = 'owner-user-123';

function makeDbRow(overrides: Partial<{
  user_id: string;
  is_public: boolean;
  prompt_versions: { content: string; version_number: number }[];
}> = {}) {
  return {
    user_id: OWNER_USER_ID,
    is_public: true,
    prompt_versions: [{ content: 'Hello {{name}}', version_number: 1 }],
    ...overrides,
  };
}

function makeParams(overrides: Partial<{
  prompt_id: string;
  variables: Record<string, string>;
}> = {}) {
  return {
    prompt_id: VALID_UUID,
    variables: {},
    ...overrides,
  };
}

describe('handleResolvePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Happy path — variables fully provided
  // -------------------------------------------------------------------------

  it('replaces all placeholders and returns empty unresolved_variables when all vars provided', async () => {
    const row = makeDbRow({
      prompt_versions: [{ content: 'Hello {{name}}, welcome to {{place}}', version_number: 1 }],
    });
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleResolvePrompt(
      makeParams({ variables: { name: 'Alice', place: 'Wonderland' } }),
      null,
      supabase,
    ) as { resolved_content: string; unresolved_variables: string[] };

    expect(result.resolved_content).toBe('Hello Alice, welcome to Wonderland');
    expect(result.unresolved_variables).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Partial variables — unresolved remain as {{name}}, listed in array
  // -------------------------------------------------------------------------

  it('leaves unresolved placeholders as-is and lists them in unresolved_variables', async () => {
    const row = makeDbRow({
      prompt_versions: [{ content: '{{greeting}}, {{name}}!', version_number: 1 }],
    });
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleResolvePrompt(
      makeParams({ variables: { greeting: 'Hello' } }), // `name` not supplied
      null,
      supabase,
    ) as { resolved_content: string; unresolved_variables: string[] };

    expect(result.resolved_content).toContain('Hello');
    expect(result.resolved_content).toContain('{{name}}'); // placeholder left intact
    expect(result.unresolved_variables).toContain('name');
    expect(result.unresolved_variables).not.toContain('greeting');
  });

  it('lists all variables as unresolved when no variables map is provided', async () => {
    const row = makeDbRow({
      prompt_versions: [{ content: '{{a}} and {{b}}', version_number: 1 }],
    });
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleResolvePrompt(
      { prompt_id: VALID_UUID }, // no variables key
      null,
      supabase,
    ) as { resolved_content: string; unresolved_variables: string[] };

    expect(result.unresolved_variables).toEqual(expect.arrayContaining(['a', 'b']));
    expect(result.resolved_content).toContain('{{a}}');
    expect(result.resolved_content).toContain('{{b}}');
  });

  // -------------------------------------------------------------------------
  // Access control — private prompt + anonymous user
  // -------------------------------------------------------------------------

  it('throws PROMPT_NOT_FOUND for a private prompt accessed by anonymous user', async () => {
    const row = makeDbRow({ is_public: false, user_id: OWNER_USER_ID });
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleResolvePrompt(makeParams(), null /* anonymous */, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.PROMPT_NOT_FOUND });
  });

  // -------------------------------------------------------------------------
  // Access control — private prompt + owner user
  // -------------------------------------------------------------------------

  it('succeeds for a private prompt accessed by the owner', async () => {
    const row = makeDbRow({ is_public: false, user_id: OWNER_USER_ID });
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleResolvePrompt(
      makeParams({ variables: { name: 'World' } }),
      OWNER_USER_ID, // owner
      supabase,
    ) as { resolved_content: string };

    expect(result.resolved_content).toBe('Hello World');
  });

  it('succeeds for a private prompt accessed by a different authenticated user who is not owner but prompt IS public', async () => {
    const row = makeDbRow({ is_public: true, user_id: OWNER_USER_ID });
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleResolvePrompt(
      makeParams({ variables: { name: 'World' } }),
      'different-user',
      supabase,
    ) as { resolved_content: string };

    expect(result.resolved_content).toBe('Hello World');
  });

  // -------------------------------------------------------------------------
  // Prompt not found
  // -------------------------------------------------------------------------

  it('throws PROMPT_NOT_FOUND when DB returns null data', async () => {
    const chain = buildQueryMock({ data: null, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleResolvePrompt(makeParams(), null, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.PROMPT_NOT_FOUND });
  });

  // -------------------------------------------------------------------------
  // DB error
  // -------------------------------------------------------------------------

  it('throws INTERNAL_ERROR when the DB returns an error', async () => {
    const chain = buildQueryMock({ data: null, error: { message: 'connection refused' } });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleResolvePrompt(makeParams(), null, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.INTERNAL_ERROR });
  });

  // -------------------------------------------------------------------------
  // Parameter validation
  // -------------------------------------------------------------------------

  it('throws INVALID_PARAMS when prompt_id is not a valid UUID', async () => {
    const chain = buildQueryMock({ data: null, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleResolvePrompt({ prompt_id: 'not-a-uuid' }, null, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.INVALID_PARAMS });
  });

  it('throws INVALID_PARAMS when params is null (missing prompt_id)', async () => {
    const chain = buildQueryMock({ data: null, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleResolvePrompt(null, null, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.INVALID_PARAMS });
  });

  // -------------------------------------------------------------------------
  // Uses latest version content
  // -------------------------------------------------------------------------

  it('resolves variables from the latest version (highest version_number)', async () => {
    const row = makeDbRow({
      prompt_versions: [
        { content: 'Old: {{old_var}}', version_number: 1 },
        { content: 'New: {{new_var}}', version_number: 2 },
      ],
      is_public: true,
    });
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleResolvePrompt(
      makeParams({ variables: { new_var: 'resolved' } }),
      null,
      supabase,
    ) as { resolved_content: string; unresolved_variables: string[] };

    expect(result.resolved_content).toBe('New: resolved');
    expect(result.unresolved_variables).not.toContain('old_var');
  });

  // -------------------------------------------------------------------------
  // prompt_id is forwarded to the DB query
  // -------------------------------------------------------------------------

  it('queries the DB with the correct prompt_id', async () => {
    const row = makeDbRow();
    const chain = buildQueryMock({ data: row, error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await handleResolvePrompt(makeParams({ prompt_id: VALID_UUID }), null, supabase);

    expect(chain.eq).toHaveBeenCalledWith('id', VALID_UUID);
  });
});
