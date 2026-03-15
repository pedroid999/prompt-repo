import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveProvider, deleteProvider, toggleProvider } from './actions';

// ---------------------------------------------------------------------------
// Supabase mock (chainable query builder)
// ---------------------------------------------------------------------------

const mockSupabase = {
  from: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
  error: null as any,
};

// Make chainable
mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.upsert.mockReturnValue(mockSupabase);
mockSupabase.update.mockReturnValue(mockSupabase);
mockSupabase.delete.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [] })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/crypto/provider-keys', () => ({
  encryptApiKey: vi.fn(() => Promise.resolve('encrypted-key-data')),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI Providers — Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.upsert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.delete.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.error = null;
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  // -------------------------------------------------------------------------
  // saveProvider
  // -------------------------------------------------------------------------

  describe('saveProvider', () => {
    it('saves a cloud provider with encryption', async () => {
      const result = await saveProvider({
        provider: 'claude',
        api_key: 'sk-test-key-123',
      });

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('user_ai_providers');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          provider: 'claude',
          encrypted_api_key: 'encrypted-key-data',
          is_active: true,
        }),
        { onConflict: 'user_id,provider' },
      );
    });

    it('returns validation error for missing api_key on cloud provider', async () => {
      const result = await saveProvider({
        provider: 'openai',
        // no api_key
      } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
      // Should NOT reach Supabase
      expect(mockSupabase.upsert).not.toHaveBeenCalled();
    });

    it('returns Unauthorized when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'not authenticated' },
      });

      const result = await saveProvider({
        provider: 'claude',
        api_key: 'sk-test',
      });

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('saves ollama provider with endpoint_url', async () => {
      const result = await saveProvider({
        provider: 'ollama',
        endpoint_url: 'http://localhost:11434',
      });

      expect(result).toEqual({ success: true });
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'ollama',
          encrypted_api_key: null,
          endpoint_url: 'http://localhost:11434',
        }),
        expect.anything(),
      );
    });

    it('returns error when upsert fails', async () => {
      // Make the upsert chain resolve with an error
      mockSupabase.error = { message: 'DB error' };

      const result = await saveProvider({
        provider: 'claude',
        api_key: 'sk-test',
      });

      expect(result).toEqual({
        success: false,
        error: 'Failed to save provider configuration',
      });
    });
  });

  // -------------------------------------------------------------------------
  // deleteProvider
  // -------------------------------------------------------------------------

  describe('deleteProvider', () => {
    it('deletes a provider successfully', async () => {
      const result = await deleteProvider({ provider: 'claude' });

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('user_ai_providers');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'claude');
    });

    it('returns Unauthorized when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'not authenticated' },
      });

      const result = await deleteProvider({ provider: 'openai' });
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns validation error for invalid provider', async () => {
      const result = await deleteProvider({ provider: 'invalid' as any });

      expect(result.success).toBe(false);
      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // toggleProvider
  // -------------------------------------------------------------------------

  describe('toggleProvider', () => {
    it('toggles a provider active state', async () => {
      const result = await toggleProvider({
        provider: 'gemini',
        is_active: false,
      });

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('user_ai_providers');
      expect(mockSupabase.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'gemini');
    });

    it('returns Unauthorized when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'not authenticated' },
      });

      const result = await toggleProvider({
        provider: 'claude',
        is_active: true,
      });
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns error when update fails', async () => {
      mockSupabase.error = { message: 'DB error' };

      const result = await toggleProvider({
        provider: 'claude',
        is_active: true,
      });

      expect(result).toEqual({
        success: false,
        error: 'Failed to toggle provider',
      });
    });
  });
});
