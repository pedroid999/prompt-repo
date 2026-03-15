import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class MockGoogleGenerativeAI {
      getGenerativeModel = mockGetGenerativeModel;
      constructor() {}
    },
  };
});

import { GeminiAdapter } from './gemini';

describe('GeminiAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent,
    });
  });

  it('should throw if no API key is provided', () => {
    expect(() => new GeminiAdapter({ provider: 'gemini' })).toThrow(
      'Gemini adapter requires an API key',
    );
  });

  it('should have name "gemini"', () => {
    const adapter = new GeminiAdapter({
      provider: 'gemini',
      apiKey: 'test-key',
    });
    expect(adapter.name).toBe('gemini');
  });

  describe('structure', () => {
    it('should return structured content from the API response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '# Structured Prompt',
          usageMetadata: {
            promptTokenCount: 80,
            candidatesTokenCount: 40,
          },
        },
      });

      const adapter = new GeminiAdapter({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      const result = await adapter.structure('brainstorm', 'system');

      expect(result.structuredContent).toBe('# Structured Prompt');
      expect(result.model).toBe('gemini-2.0-flash');
      expect(result.tokensUsed).toEqual({ input: 80, output: 40 });
    });

    it('should pass system instruction and user content to the model', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'result',
          usageMetadata: null,
        },
      });

      const adapter = new GeminiAdapter({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      await adapter.structure('my notes', 'my system prompt');

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: 'my system prompt',
        }),
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{ role: 'user', parts: [{ text: 'my notes' }] }],
          generationConfig: { maxOutputTokens: 4096 },
        }),
      );
    });

    it('should handle missing usage metadata', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'result',
          usageMetadata: undefined,
        },
      });

      const adapter = new GeminiAdapter({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      const result = await adapter.structure('text', 'system');
      expect(result.tokensUsed).toBeUndefined();
    });

    it('should use custom model when specified', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'result',
          usageMetadata: null,
        },
      });

      const adapter = new GeminiAdapter({
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-1.5-pro',
      });

      const result = await adapter.structure('text', 'system');
      expect(result.model).toBe('gemini-1.5-pro');
    });

    it('should propagate API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API key invalid'));

      const adapter = new GeminiAdapter({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      await expect(adapter.structure('text', 'system')).rejects.toThrow(
        'API key invalid',
      );
    });
  });
});
