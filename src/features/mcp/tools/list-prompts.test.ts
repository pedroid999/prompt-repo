import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleListPrompts } from './list-prompts';
import { MCP_ERROR_CODES } from '../types';

// ---------------------------------------------------------------------------
// Supabase mock builder
// ---------------------------------------------------------------------------

/**
 * Builds a chainable Supabase mock that mimics:
 *   supabase.from(...).select(...).is(...).order(...).range(...)[.or(...)|.eq(...)]
 *
 * `resolvedValue` is what the final await returns.
 * `onChainReady` is called with the chain object after `.range()` so tests can
 * attach `.or()` / `.eq()` expectations.
 */
function buildQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    from: vi.fn(),
    select: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    or: vi.fn(),
    eq: vi.fn(),
  };

  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.range.mockReturnValue(chain);
  // Both `.or()` and `.eq()` return a thenable that resolves to the value
  chain.or.mockResolvedValue(resolvedValue);
  chain.eq.mockResolvedValue(resolvedValue);

  return chain;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeDbRow(overrides: Partial<{
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  prompt_versions: { content: string; version_number: number }[];
}> = {}) {
  return {
    id: 'prompt-1',
    title: 'My Prompt',
    description: 'A description',
    is_public: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    prompt_versions: [
      { content: 'Hello {{name}}, you are in {{place}}', version_number: 1 },
    ],
    ...overrides,
  };
}

describe('handleListPrompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Access control
  // -------------------------------------------------------------------------

  it('filters by is_public=true for anonymous callers (userId null)', async () => {
    const chain = buildQueryMock({ data: [], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await handleListPrompts(null, null, supabase);

    expect(chain.eq).toHaveBeenCalledWith('is_public', true);
    expect(chain.or).not.toHaveBeenCalled();
  });

  it('uses OR filter for authenticated callers (userId present)', async () => {
    const chain = buildQueryMock({ data: [], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await handleListPrompts(null, 'user-123', supabase);

    expect(chain.or).toHaveBeenCalledWith('user_id.eq.user-123,is_public.eq.true');
    expect(chain.eq).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Archived prompts excluded
  // -------------------------------------------------------------------------

  it('always applies archived_at IS NULL filter', async () => {
    const chain = buildQueryMock({ data: [], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await handleListPrompts(null, null, supabase);

    expect(chain.is).toHaveBeenCalledWith('archived_at', null);
  });

  // -------------------------------------------------------------------------
  // Result mapping — content is NOT returned, variables ARE extracted
  // -------------------------------------------------------------------------

  it('does not include a content field in the returned prompt entries', async () => {
    const row = makeDbRow();
    const chain = buildQueryMock({ data: [row], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleListPrompts(null, null, supabase) as { prompts: Record<string, unknown>[] };

    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0]).not.toHaveProperty('content');
  });

  it('extracts variables from the latest version content', async () => {
    const row = makeDbRow({
      prompt_versions: [
        { content: 'Old version {{old}}', version_number: 1 },
        { content: 'New version {{name}} and {{city}}', version_number: 2 },
      ],
    });
    const chain = buildQueryMock({ data: [row], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleListPrompts(null, null, supabase) as { prompts: { variables: string[] }[] };

    // Should pick version 2 (highest version_number) and extract its variables
    expect(result.prompts[0].variables).toEqual(expect.arrayContaining(['name', 'city']));
    expect(result.prompts[0].variables).not.toContain('old');
  });

  it('maps id, title, and description from the DB row', async () => {
    const row = makeDbRow({
      id: 'abc-123',
      title: 'Test Title',
      description: 'Test description',
    });
    const chain = buildQueryMock({ data: [row], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleListPrompts(null, null, supabase) as { prompts: { id: string; title: string; description: string | null }[] };

    expect(result.prompts[0].id).toBe('abc-123');
    expect(result.prompts[0].title).toBe('Test Title');
    expect(result.prompts[0].description).toBe('Test description');
  });

  it('handles prompt with no versions gracefully (empty variables array)', async () => {
    const row = makeDbRow({ prompt_versions: [] });
    const chain = buildQueryMock({ data: [row], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleListPrompts(null, null, supabase) as { prompts: { variables: string[] }[] };

    expect(result.prompts[0].variables).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Pagination — invalid limit > 100
  // -------------------------------------------------------------------------

  it('throws MCPError -32602 when limit exceeds 100', async () => {
    const chain = buildQueryMock({ data: [], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleListPrompts({ limit: 101 }, null, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.INVALID_PARAMS });
  });

  it('throws MCPError -32602 when limit is 0 (below minimum)', async () => {
    const chain = buildQueryMock({ data: [], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleListPrompts({ limit: 0 }, null, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.INVALID_PARAMS });
  });

  // -------------------------------------------------------------------------
  // Database error
  // -------------------------------------------------------------------------

  it('throws MCPError -32603 when the DB returns an error', async () => {
    const chain = buildQueryMock({ data: null, error: { message: 'timeout' } });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await expect(
      handleListPrompts(null, null, supabase),
    ).rejects.toMatchObject({ code: MCP_ERROR_CODES.INTERNAL_ERROR });
  });

  // -------------------------------------------------------------------------
  // Empty result set
  // -------------------------------------------------------------------------

  it('returns empty prompts array when DB returns no rows', async () => {
    const chain = buildQueryMock({ data: [], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    const result = await handleListPrompts(null, null, supabase) as { prompts: unknown[] };

    expect(result.prompts).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Default params used when called with null/undefined params
  // -------------------------------------------------------------------------

  it('uses default limit=20 and offset=0 when params are null', async () => {
    const chain = buildQueryMock({ data: [], error: null });
    const supabase = { from: chain.from } as unknown as SupabaseClient;

    await handleListPrompts(null, null, supabase);

    // range(0, 19) corresponds to limit=20, offset=0
    expect(chain.range).toHaveBeenCalledWith(0, 19);
  });
});
