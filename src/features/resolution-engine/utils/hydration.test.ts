import { describe, it, expect } from 'vitest';
import { hydrateResolutionForm } from './hydration';

describe('hydrateResolutionForm', () => {
  it('should merge snapshot variables with default empty values', () => {
    const extractedVariables = ['name', 'age', 'city'];
    const snapshotVariables = {
      name: 'John',
      age: '30',
    };

    const result = hydrateResolutionForm(extractedVariables, snapshotVariables);

    expect(result).toEqual({
      name: 'John',
      age: '30',
      city: '',
    });
  });

  it('should ignore extra variables in snapshot that are not in extracted variables', () => {
    const extractedVariables = ['name'];
    const snapshotVariables = {
      name: 'John',
      extra: 'data',
    };

    const result = hydrateResolutionForm(extractedVariables, snapshotVariables);

    expect(result).toEqual({
      name: 'John',
    });
  });

  it('should return all empty strings if snapshot variables are undefined', () => {
    const extractedVariables = ['name', 'age'];
    
    const result = hydrateResolutionForm(extractedVariables, undefined);

    expect(result).toEqual({
      name: '',
      age: '',
    });
  });

  it('should handle empty extracted variables', () => {
    const extractedVariables: string[] = [];
    const snapshotVariables = { name: 'John' };

    const result = hydrateResolutionForm(extractedVariables, snapshotVariables);

    expect(result).toEqual({});
  });

  it('should complete hydration in less than 50ms (NFR9)', () => {
    const extractedVariables = Array.from({ length: 100 }, (_, i) => `var${i}`);
    const snapshotVariables = extractedVariables.reduce((acc, v) => ({ ...acc, [v]: 'value' }), {});

    const start = performance.now();
    hydrateResolutionForm(extractedVariables, snapshotVariables);
    const end = performance.now();

    expect(end - start).toBeLessThan(50);
  });
});
