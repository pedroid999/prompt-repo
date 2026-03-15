import { describe, it, expect } from 'vitest';
import { structureRequestSchema } from './ai-composer';

describe('structureRequestSchema', () => {
  it('should accept a valid request with provider and brainstorm text', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: 'Write a prompt about coding best practices',
      provider: 'claude',
    });
    expect(result.success).toBe(true);
  });

  it('should accept a valid request with optional model', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: 'Some brainstorm notes',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('gpt-4o-mini');
    }
  });

  it('should fail when brainstorm text is missing', () => {
    const result = structureRequestSchema.safeParse({
      provider: 'claude',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when brainstorm text is empty', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: '',
      provider: 'claude',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when brainstorm text is only whitespace', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: '   ',
      provider: 'claude',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when brainstorm text exceeds 50,000 characters', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: 'a'.repeat(50001),
      provider: 'claude',
    });
    expect(result.success).toBe(false);
  });

  it('should accept brainstorm text at exactly 50,000 characters', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: 'a'.repeat(50000),
      provider: 'claude',
    });
    expect(result.success).toBe(true);
  });

  it('should fail for an invalid provider name', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: 'Some text',
      provider: 'invalid-provider',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid provider names', () => {
    for (const provider of ['claude', 'openai', 'gemini', 'ollama']) {
      const result = structureRequestSchema.safeParse({
        brainstormText: 'Some text',
        provider,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should fail when model name exceeds 100 characters', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: 'Some text',
      provider: 'claude',
      model: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('should trim brainstorm text', () => {
    const result = structureRequestSchema.safeParse({
      brainstormText: '  some text  ',
      provider: 'claude',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brainstormText).toBe('some text');
    }
  });
});
