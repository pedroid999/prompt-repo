import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock both dependencies before importing the module under test
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}));

vi.mock('@/lib/api-keys/hash', () => ({
  hashApiKey: vi.fn(),
}));

import { verifyApiKey } from './verify';
import { createServiceClient } from '@/lib/supabase/service';
import { hashApiKey } from '@/lib/api-keys/hash';

// ---------------------------------------------------------------------------
// Helpers to build a chainable Supabase query mock
// ---------------------------------------------------------------------------

function buildSupabaseMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    maybeSingle: vi.fn(),
  };

  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(resolvedValue);

  return chain;
}

describe('verifyApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { valid: true, userId } for a valid non-revoked key', async () => {
    const fakeHash = 'deadbeef'.repeat(8); // 64 chars
    vi.mocked(hashApiKey).mockResolvedValue(fakeHash);

    const supabaseMock = buildSupabaseMock({
      data: { user_id: 'user-123' },
      error: null,
    });
    vi.mocked(createServiceClient).mockReturnValue(supabaseMock as never);

    const result = await verifyApiKey('plaintext-key');

    expect(result).toEqual({ valid: true, userId: 'user-123' });
    expect(hashApiKey).toHaveBeenCalledWith('plaintext-key');
    expect(supabaseMock.eq).toHaveBeenCalledWith('key_hash', fakeHash);
    expect(supabaseMock.is).toHaveBeenCalledWith('revoked_at', null);
  });

  it('returns { valid: false } when no matching row exists in the DB', async () => {
    vi.mocked(hashApiKey).mockResolvedValue('a'.repeat(64));

    const supabaseMock = buildSupabaseMock({ data: null, error: null });
    vi.mocked(createServiceClient).mockReturnValue(supabaseMock as never);

    const result = await verifyApiKey('unknown-key');

    expect(result).toEqual({ valid: false });
  });

  it('returns { valid: false } when the DB returns an error', async () => {
    vi.mocked(hashApiKey).mockResolvedValue('b'.repeat(64));

    const supabaseMock = buildSupabaseMock({
      data: null,
      error: { message: 'connection refused' },
    });
    vi.mocked(createServiceClient).mockReturnValue(supabaseMock as never);

    const result = await verifyApiKey('any-key');

    expect(result).toEqual({ valid: false });
  });

  it('returns { valid: false } when hashing throws', async () => {
    vi.mocked(hashApiKey).mockRejectedValue(new Error('crypto failure'));

    const result = await verifyApiKey('bad-key');

    expect(result).toEqual({ valid: false });
    // createServiceClient must not have been called because hashing failed first
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
