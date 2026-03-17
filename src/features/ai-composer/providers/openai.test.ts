import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockCreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockCreate } };
      constructor() {}
    },
  };
});

import { OpenAiAdapter } from './openai';

describe('OpenAiAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if no API key is provided', () => {
    expect(() => new OpenAiAdapter({ provider: 'openai' })).toThrow(
      'OpenAI adapter requires an API key',
    );
  });

  it('should have name "openai"', () => {
    const adapter = new OpenAiAdapter({
      provider: 'openai',
      apiKey: 'test-key',
    });
    expect(adapter.name).toBe('openai');
  });

  describe('structure', () => {
    it('should return structured content from the API response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '# Structured Result' } }],
        model: 'gpt-4o-mini',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });

      const adapter = new OpenAiAdapter({
        provider: 'openai',
        apiKey: 'test-key',
      });

      const result = await adapter.structure('brainstorm', 'system');

      expect(result.structuredContent).toBe('# Structured Result');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.tokensUsed).toEqual({ input: 100, output: 50 });
    });

    it('should pass system and user messages to the API', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'result' } }],
        model: 'gpt-4o-mini',
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });

      const adapter = new OpenAiAdapter({
        provider: 'openai',
        apiKey: 'test-key',
      });

      await adapter.structure('my notes', 'system prompt');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'system prompt' },
            { role: 'user', content: 'my notes' },
          ],
          max_tokens: 4096,
        }),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('should return empty string when no choice content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
        model: 'gpt-4o-mini',
        usage: null,
      });

      const adapter = new OpenAiAdapter({
        provider: 'openai',
        apiKey: 'test-key',
      });

      const result = await adapter.structure('text', 'system');
      expect(result.structuredContent).toBe('');
    });

    it('should handle missing usage data', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'result' } }],
        model: 'gpt-4o-mini',
        usage: undefined,
      });

      const adapter = new OpenAiAdapter({
        provider: 'openai',
        apiKey: 'test-key',
      });

      const result = await adapter.structure('text', 'system');
      expect(result.tokensUsed).toBeUndefined();
    });

    it('should use custom model when specified', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'result' } }],
        model: 'gpt-4o-mini',
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });

      const adapter = new OpenAiAdapter({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
      });

      await adapter.structure('text', 'system');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o-mini' }),
        expect.anything(),
      );
    });

    it('should propagate API errors', async () => {
      mockCreate.mockRejectedValue(new Error('Insufficient quota'));

      const adapter = new OpenAiAdapter({
        provider: 'openai',
        apiKey: 'test-key',
      });

      await expect(adapter.structure('text', 'system')).rejects.toThrow(
        'Insufficient quota',
      );
    });
  });
});
