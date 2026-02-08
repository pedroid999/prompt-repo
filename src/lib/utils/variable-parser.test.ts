import { describe, it, expect } from 'vitest';
import { extractVariables } from './variable-parser';

describe('extractVariables', () => {
  it('should extract variables from a simple string', () => {
    const content = 'Hello {{name}}, how is {{location}}?';
    expect(extractVariables(content)).toEqual(['name', 'location']);
  });

  it('should handle spaces inside brackets', () => {
    const content = 'Hello {{ name }}, how is {{  location  }}?';
    expect(extractVariables(content)).toEqual(['name', 'location']);
  });

  it('should handle internal spaces', () => {
    const content = 'Fill in {{ first name }} and {{ last name }}';
    expect(extractVariables(content)).toEqual(['first name', 'last name']);
  });

  it('should handle special characters', () => {
    const content = 'Test {{user_name}}, {{api-key}}, {{var.prop}}';
    expect(extractVariables(content)).toEqual(['user_name', 'api-key', 'var.prop']);
  });

  it('should return a unique list (deduplication)', () => {
    const content = '{{user}} says hi to {{user}}';
    expect(extractVariables(content)).toEqual(['user']);
  });

  it('should ignore malformed tags', () => {
    const content = 'This is {malformed}, and this is {{unclosed';
    expect(extractVariables(content)).toEqual([]);
  });

  it('should handle empty string', () => {
    expect(extractVariables('')).toEqual([]);
  });

  it('should handle string without variables', () => {
    expect(extractVariables('just some text')).toEqual([]);
  });

  it('should handle multiline content', () => {
    const content = `
      {{ var1 }}
      {{ var2 }}
    `;
    expect(extractVariables(content)).toEqual(['var1', 'var2']);
  });

  it('should meet performance requirements (NFR1: <50ms for 10KB)', () => {
    const largeContent = '{{var}} '.repeat(1000); // approx 7KB
    const start = performance.now();
    extractVariables(largeContent);
    const end = performance.now();
    expect(end - start).toBeLessThan(50);
  });
});
