import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { OllamaAdapter } from './ollama';

describe('OllamaAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if no endpoint is provided', () => {
    expect(() => new OllamaAdapter({ provider: 'ollama' })).toThrow(
      'Ollama adapter requires an endpoint URL',
    );
  });

  it('should have name "ollama"', () => {
    const adapter = new OllamaAdapter({
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
    });
    expect(adapter.name).toBe('ollama');
  });

  it('should strip trailing slashes from the endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          model: 'llama3.1',
          message: { role: 'assistant', content: 'result' },
          prompt_eval_count: 10,
          eval_count: 5,
        }),
    });

    const adapter = new OllamaAdapter({
      provider: 'ollama',
      endpoint: 'http://localhost:11434/',
    });

    await adapter.structure('text', 'system');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.anything(),
    );
  });

  describe('structure', () => {
    it('should return structured content from the API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            model: 'llama3.1',
            message: { role: 'assistant', content: '# Structured Prompt' },
            prompt_eval_count: 100,
            eval_count: 50,
          }),
      });

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      const result = await adapter.structure('brainstorm', 'system');

      expect(result.structuredContent).toBe('# Structured Prompt');
      expect(result.model).toBe('llama3.1');
      expect(result.tokensUsed).toEqual({ input: 100, output: 50 });
    });

    it('should send correct request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            model: 'llama3.1',
            message: { role: 'assistant', content: 'result' },
          }),
      });

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      await adapter.structure('my notes', 'system prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.1',
            messages: [
              { role: 'system', content: 'system prompt' },
              { role: 'user', content: 'my notes' },
            ],
            stream: false,
          }),
        }),
      );
    });

    it('should handle missing token counts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            model: 'llama3.1',
            message: { role: 'assistant', content: 'result' },
          }),
      });

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      const result = await adapter.structure('text', 'system');
      expect(result.tokensUsed).toBeUndefined();
    });

    it('should throw on non-OK HTTP response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      await expect(adapter.structure('text', 'system')).rejects.toThrow(
        'Ollama API error (500): Internal Server Error',
      );
    });

    it('should handle fetch network errors', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      await expect(adapter.structure('text', 'system')).rejects.toThrow(
        'ECONNREFUSED',
      );
    });

    it('should use custom model when specified', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            model: 'mistral',
            message: { role: 'assistant', content: 'result' },
          }),
      });

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        model: 'mistral',
      });

      await adapter.structure('text', 'system');

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.model).toBe('mistral');
    });
  });

  describe('listModels', () => {
    it('should return a list of model names', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [
              { name: 'llama3.1', modified_at: '2024-01-01', size: 1000 },
              { name: 'mistral', modified_at: '2024-01-01', size: 2000 },
              { name: 'codellama', modified_at: '2024-01-01', size: 3000 },
            ],
          }),
      });

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      const models = await adapter.listModels();

      expect(models).toEqual(['llama3.1', 'mistral', 'codellama']);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should throw on non-OK response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      await expect(adapter.listModels()).rejects.toThrow(
        'Ollama /api/tags error (404)',
      );
    });

    it('should handle connection errors', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      const adapter = new OllamaAdapter({
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      });

      await expect(adapter.listModels()).rejects.toThrow('ECONNREFUSED');
    });
  });
});
