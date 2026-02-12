import { describe, it, expect } from 'vitest';
import { calculateDiff } from './diff';

describe('calculateDiff', () => {
  it('identifies unchanged lines with line numbers', () => {
    const oldStr = 'line 1\nline 2';
    const newStr = 'line 1\nline 2';
    const result = calculateDiff(oldStr, newStr);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ content: 'line 1', type: 'unchanged', oldLineNumber: 1, newLineNumber: 1 });
    expect(result[1]).toEqual({ content: 'line 2', type: 'unchanged', oldLineNumber: 2, newLineNumber: 2 });
  });

  it('identifies added lines with line numbers', () => {
    const oldStr = 'line 1\n';
    const newStr = 'line 1\nline 2\n';
    const result = calculateDiff(oldStr, newStr);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ content: 'line 1', type: 'unchanged', oldLineNumber: 1, newLineNumber: 1 });
    expect(result[1]).toEqual({ content: 'line 2', type: 'added', newLineNumber: 2 });
  });

  it('identifies removed lines with line numbers', () => {
    const oldStr = 'line 1\nline 2\n';
    const newStr = 'line 1\n';
    const result = calculateDiff(oldStr, newStr);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ content: 'line 1', type: 'unchanged', oldLineNumber: 1, newLineNumber: 1 });
    expect(result[1]).toEqual({ content: 'line 2', type: 'removed', oldLineNumber: 2 });
  });

  it('handles Windows line endings (\r\n)', () => {
    const oldStr = 'line 1\r\nline 2';
    const newStr = 'line 1\nline 2 changed';
    const result = calculateDiff(oldStr, newStr);
    
    expect(result[0].content).toBe('line 1');
    expect(result[0].type).toBe('unchanged');
    expect(result[1].type).toBe('removed');
    expect(result[2].type).toBe('added');
    expect(result[2].content).toBe('line 2 changed');
  });

  it('should be fast (NFR reference)', () => {
    const oldStr = 'line\n'.repeat(100);
    const newStr = 'line\n'.repeat(50) + 'new\n' + 'line\n'.repeat(50);
    
    const start = performance.now();
    calculateDiff(oldStr, newStr);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(16); // 60fps target
  });
});
