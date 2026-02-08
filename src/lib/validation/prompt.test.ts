import { describe, it, expect } from 'vitest';
import { promptCreateSchema } from './prompt';

describe('promptCreateSchema', () => {
  it('should validate a valid prompt', () => {
    const validData = {
      title: 'My Prompt',
      content: 'This is the content',
      description: 'A description',
      version_note: 'Initial version',
    };
    const result = promptCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate a valid prompt without optional fields', () => {
    const validData = {
      title: 'My Prompt',
      content: 'This is the content',
    };
    const result = promptCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should trim inputs', () => {
    const data = {
      title: '  My Prompt  ',
      content: '  Content  ',
    };
    const result = promptCreateSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Prompt');
      expect(result.data.content).toBe('Content');
    }
  });

  it('should fail if title is missing', () => {
    const invalidData = {
      content: 'This is the content',
    };
    const result = promptCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail if title exceeds max length', () => {
    const invalidData = {
      title: 'a'.repeat(101),
      content: 'Content',
    };
    const result = promptCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail if content is missing', () => {
    const invalidData = {
      title: 'My Prompt',
    };
    const result = promptCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});