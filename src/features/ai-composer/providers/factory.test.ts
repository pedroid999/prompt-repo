import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Mock all provider adapters so their constructors don't fail on SDK init
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: vi.fn() };
    constructor() {}
  },
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
    constructor() {}
  },
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    getGenerativeModel = vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    });
    constructor() {}
  },
}));

import { createProvider } from './factory';
import { ClaudeAdapter } from './claude';
import { OpenAiAdapter } from './openai';
import { GeminiAdapter } from './gemini';
import { OllamaAdapter } from './ollama';

describe('createProvider', () => {
  it('should return a ClaudeAdapter for provider "claude"', () => {
    const provider = createProvider({
      provider: 'claude',
      apiKey: 'test-key',
    });
    expect(provider).toBeInstanceOf(ClaudeAdapter);
    expect(provider.name).toBe('claude');
  });

  it('should return an OpenAiAdapter for provider "openai"', () => {
    const provider = createProvider({
      provider: 'openai',
      apiKey: 'test-key',
    });
    expect(provider).toBeInstanceOf(OpenAiAdapter);
    expect(provider.name).toBe('openai');
  });

  it('should return a GeminiAdapter for provider "gemini"', () => {
    const provider = createProvider({
      provider: 'gemini',
      apiKey: 'test-key',
    });
    expect(provider).toBeInstanceOf(GeminiAdapter);
    expect(provider.name).toBe('gemini');
  });

  it('should return an OllamaAdapter for provider "ollama"', () => {
    const provider = createProvider({
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
    });
    expect(provider).toBeInstanceOf(OllamaAdapter);
    expect(provider.name).toBe('ollama');
  });

  it('should throw for an unknown provider', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createProvider({ provider: 'unknown' as any }),
    ).toThrow('Unknown provider');
  });
});
