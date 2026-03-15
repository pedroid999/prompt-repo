import { describe, it, expect } from 'vitest';
import {
  saveProviderSchema,
  deleteProviderSchema,
  toggleProviderSchema,
} from './ai-providers';

describe('saveProviderSchema', () => {
  it('should accept a valid cloud provider with API key', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'claude',
      api_key: 'sk-ant-api03-abc123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept openai with API key', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'openai',
      api_key: 'sk-abc123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept gemini with API key', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'gemini',
      api_key: 'AIzaSyAbc123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid Ollama with endpoint URL', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'ollama',
      endpoint_url: 'http://localhost:11434',
    });
    expect(result.success).toBe(true);
  });

  it('should fail for cloud provider without API key', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'claude',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('API key is required for cloud providers');
    }
  });

  it('should fail for Ollama without endpoint URL', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'ollama',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Endpoint URL is required for Ollama');
    }
  });

  it('should fail for invalid provider name', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'unknown-llm',
      api_key: 'key',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when API key exceeds max length', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'openai',
      api_key: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('should fail when endpoint URL is not a valid URL', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'ollama',
      endpoint_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('should trim the API key', () => {
    const result = saveProviderSchema.safeParse({
      provider: 'claude',
      api_key: '  sk-abc  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.api_key).toBe('sk-abc');
    }
  });
});

describe('deleteProviderSchema', () => {
  it('should accept a valid provider name', () => {
    const result = deleteProviderSchema.safeParse({ provider: 'claude' });
    expect(result.success).toBe(true);
  });

  it('should reject an invalid provider name', () => {
    const result = deleteProviderSchema.safeParse({ provider: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject missing provider', () => {
    const result = deleteProviderSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('toggleProviderSchema', () => {
  it('should accept a valid provider and boolean is_active', () => {
    const result = toggleProviderSchema.safeParse({
      provider: 'openai',
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('should accept is_active as false', () => {
    const result = toggleProviderSchema.safeParse({
      provider: 'gemini',
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-boolean is_active', () => {
    const result = toggleProviderSchema.safeParse({
      provider: 'claude',
      is_active: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing is_active', () => {
    const result = toggleProviderSchema.safeParse({ provider: 'ollama' });
    expect(result.success).toBe(false);
  });
});
