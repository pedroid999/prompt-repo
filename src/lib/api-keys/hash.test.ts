import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey } from './hash';

describe('generateApiKey', () => {
  it('returns a 64-character string', () => {
    const key = generateApiKey();
    expect(key).toHaveLength(64);
  });

  it('returns only lowercase hex characters', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces unique values on each call', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });
});

describe('hashApiKey', () => {
  it('returns a 64-character string', async () => {
    const hash = await hashApiKey('some-key');
    expect(hash).toHaveLength(64);
  });

  it('returns only lowercase hex characters', async () => {
    const hash = await hashApiKey('some-key');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same input produces same hash', async () => {
    const input = 'my-secret-api-key';
    const hash1 = await hashApiKey(input);
    const hash2 = await hashApiKey(input);
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashApiKey('key-one');
    const hash2 = await hashApiKey('key-two');
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string without throwing', async () => {
    await expect(hashApiKey('')).resolves.toHaveLength(64);
  });
});
