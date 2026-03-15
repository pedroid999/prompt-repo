import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only (it throws at import time in non-server environments)
vi.mock('server-only', () => ({}));

// Mock the Anthropic SDK
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor() {}
    },
  };
});

import { ClaudeAdapter } from './claude';

describe('ClaudeAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if no API key is provided', () => {
    expect(() => new ClaudeAdapter({ provider: 'claude' })).toThrow(
      'Claude adapter requires an API key',
    );
  });

  it('should use the default model when none is specified', () => {
    const adapter = new ClaudeAdapter({
      provider: 'claude',
      apiKey: 'test-key',
    });
    expect(adapter.name).toBe('claude');
  });

  describe('structure', () => {
    it('should return structured content from the API response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: '# Structured Prompt\n\nHello world' }],
        model: 'claude-sonnet-4-6-20250514',
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const adapter = new ClaudeAdapter({
        provider: 'claude',
        apiKey: 'test-key',
      });

      const result = await adapter.structure('brainstorm notes', 'system prompt');

      expect(result.structuredContent).toBe(
        '# Structured Prompt\n\nHello world',
      );
      expect(result.model).toBe('claude-sonnet-4-6-20250514');
      expect(result.tokensUsed).toEqual({ input: 100, output: 50 });
    });

    it('should pass system prompt and brainstorm text to the API', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'result' }],
        model: 'claude-sonnet-4-6-20250514',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const adapter = new ClaudeAdapter({
        provider: 'claude',
        apiKey: 'test-key',
      });

      await adapter.structure('my brainstorm', 'my system prompt');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'my system prompt',
          messages: [{ role: 'user', content: 'my brainstorm' }],
          max_tokens: 4096,
        }),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('should use custom model when specified', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'result' }],
        model: 'claude-opus-4-20250514',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const adapter = new ClaudeAdapter({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-opus-4-20250514',
      });

      await adapter.structure('text', 'system');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-opus-4-20250514' }),
        expect.anything(),
      );
    });

    it('should return empty string when no text block is found', async () => {
      mockCreate.mockResolvedValue({
        content: [],
        model: 'claude-sonnet-4-6-20250514',
        usage: { input_tokens: 10, output_tokens: 0 },
      });

      const adapter = new ClaudeAdapter({
        provider: 'claude',
        apiKey: 'test-key',
      });

      const result = await adapter.structure('text', 'system');
      expect(result.structuredContent).toBe('');
    });

    it('should propagate API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      const adapter = new ClaudeAdapter({
        provider: 'claude',
        apiKey: 'test-key',
      });

      await expect(adapter.structure('text', 'system')).rejects.toThrow(
        'API rate limit exceeded',
      );
    });
  });
});
