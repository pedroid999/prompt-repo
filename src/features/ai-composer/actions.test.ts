import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only (it throws at import time in non-server environments)
vi.mock('server-only', () => ({}));

import { structurePrompt, listOllamaModels } from './actions';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [] })),
}));

// ---------------------------------------------------------------------------
// Provider config mock
// ---------------------------------------------------------------------------

vi.mock('@/features/ai-providers/queries', () => ({
  getProviderConfig: vi.fn(),
}));

import { getProviderConfig } from '@/features/ai-providers/queries';

// ---------------------------------------------------------------------------
// Provider factory mock
// ---------------------------------------------------------------------------

const mockAdapter = {
  name: 'claude' as const,
  structure: vi.fn(),
};

vi.mock('@/features/ai-composer/providers', () => ({
  createProvider: vi.fn(() => mockAdapter),
  STRUCTURING_SYSTEM_PROMPT: 'You are a prompt structuring assistant.',
}));

// ---------------------------------------------------------------------------
// Ollama adapter mock
// ---------------------------------------------------------------------------

const mockListModels = vi.fn();

vi.mock('@/features/ai-composer/providers/ollama', () => ({
  OllamaAdapter: class MockOllamaAdapter {
    constructor() {}
    listModels = mockListModels;
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI Composer — Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  // -------------------------------------------------------------------------
  // structurePrompt
  // -------------------------------------------------------------------------

  describe('structurePrompt', () => {
    it('returns structured content on success', async () => {
      vi.mocked(getProviderConfig).mockResolvedValue({
        success: true,
        data: { provider: 'claude', apiKey: 'decrypted-key' },
      });

      mockAdapter.structure.mockResolvedValue({
        structuredContent: '# Structured prompt\n\nHello {{name}}',
        model: 'claude-sonnet-4-6',
        tokensUsed: { input: 100, output: 50 },
      });

      const result = await structurePrompt({
        brainstormText: 'I need a prompt for greeting people',
        provider: 'claude',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.structuredContent).toContain('Structured prompt');
        expect(result.data.model).toBe('claude-sonnet-4-6');
      }
    });

    it('returns error when no provider is configured', async () => {
      vi.mocked(getProviderConfig).mockResolvedValue({
        success: false,
        error: 'Provider "claude" is not configured or is disabled',
      });

      const result = await structurePrompt({
        brainstormText: 'some text',
        provider: 'claude',
      });

      expect(result).toEqual({
        success: false,
        error: 'Provider "claude" is not configured or is disabled',
      });
    });

    it('returns user-friendly error on provider timeout', async () => {
      vi.mocked(getProviderConfig).mockResolvedValue({
        success: true,
        data: { provider: 'claude', apiKey: 'key' },
      });

      mockAdapter.structure.mockRejectedValue(new Error('The operation was abort'));

      const result = await structurePrompt({
        brainstormText: 'some text',
        provider: 'claude',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('timed out');
      }
    });

    it('returns Unauthorized when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'not auth' },
      });

      const result = await structurePrompt({
        brainstormText: 'some text',
        provider: 'claude',
      });

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns validation error for empty brainstorm text', async () => {
      const result = await structurePrompt({
        brainstormText: '',
        provider: 'claude',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
      // Should not reach auth
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // listOllamaModels
  // -------------------------------------------------------------------------

  describe('listOllamaModels', () => {
    it('returns model list on success', async () => {
      mockListModels.mockResolvedValue(['llama3', 'codellama', 'mistral']);

      const result = await listOllamaModels('http://localhost:11434');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['llama3', 'codellama', 'mistral']);
      }
    });

    it('returns error on connection failure', async () => {
      mockListModels.mockRejectedValue(new Error('fetch failed'));

      const result = await listOllamaModels('http://localhost:11434');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Could not connect to Ollama');
      }
    });

    it('returns validation error for invalid URL', async () => {
      const result = await listOllamaModels('not-a-url');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('valid URL');
      }
      expect(mockListModels).not.toHaveBeenCalled();
    });

    it('returns error on timeout', async () => {
      mockListModels.mockRejectedValue(new Error('abort timeout'));

      const result = await listOllamaModels('http://localhost:11434');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('timed out');
      }
    });
  });
});
