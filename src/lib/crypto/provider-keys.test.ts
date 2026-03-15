import { describe, it, expect, vi, beforeEach } from 'vitest';
import { maskApiKey, encryptApiKey, decryptApiKey } from './provider-keys';

// Mock the service client
const mockRpc = vi.fn();
const mockSupabase = { rpc: mockRpc };

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}));

describe('maskApiKey', () => {
  it('should return null for null input', () => {
    expect(maskApiKey(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(maskApiKey(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(maskApiKey('')).toBeNull();
  });

  it('should mask a long key showing first 3 and last 3 chars', () => {
    expect(maskApiKey('sk-ant-api03-abcdef123xyz')).toBe('sk-...xyz');
  });

  it('should mask a short key (<=6 chars) showing only first 3 and ellipsis', () => {
    expect(maskApiKey('short')).toBe('sho...');
  });

  it('should mask a 6-char key showing first 3 and ellipsis', () => {
    expect(maskApiKey('abcdef')).toBe('abc...');
  });

  it('should mask a 7-char key showing first 3 and last 3', () => {
    expect(maskApiKey('abcdefg')).toBe('abc...efg');
  });
});

describe('encryptApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_PROVIDER_ENCRYPTION_KEY = 'test-passphrase';
  });

  it('should call pgp_sym_encrypt_text RPC and return encrypted value', async () => {
    mockRpc.mockResolvedValue({
      data: 'encrypted-ciphertext',
      error: null,
    });

    const result = await encryptApiKey('my-secret-key');

    expect(result).toBe('encrypted-ciphertext');
    expect(mockRpc).toHaveBeenCalledWith('pgp_sym_encrypt_text', {
      plaintext_value: 'my-secret-key',
      passphrase_value: 'test-passphrase',
    });
  });

  it('should throw if RPC returns an error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'encryption failed' },
    });

    await expect(encryptApiKey('my-key')).rejects.toThrow(
      'Failed to encrypt API key: encryption failed',
    );
  });

  it('should throw if encryption key env var is missing', async () => {
    delete process.env.AI_PROVIDER_ENCRYPTION_KEY;

    await expect(encryptApiKey('my-key')).rejects.toThrow(
      'Missing environment variable: AI_PROVIDER_ENCRYPTION_KEY',
    );
  });
});

describe('decryptApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_PROVIDER_ENCRYPTION_KEY = 'test-passphrase';
  });

  it('should call pgp_sym_decrypt_text RPC and return decrypted value', async () => {
    mockRpc.mockResolvedValue({
      data: 'decrypted-plaintext',
      error: null,
    });

    const result = await decryptApiKey('encrypted-ciphertext');

    expect(result).toBe('decrypted-plaintext');
    expect(mockRpc).toHaveBeenCalledWith('pgp_sym_decrypt_text', {
      ciphertext_value: 'encrypted-ciphertext',
      passphrase_value: 'test-passphrase',
    });
  });

  it('should throw if RPC returns an error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'decryption failed' },
    });

    await expect(decryptApiKey('bad-ciphertext')).rejects.toThrow(
      'Failed to decrypt API key: decryption failed',
    );
  });

  it('should throw if encryption key env var is missing', async () => {
    delete process.env.AI_PROVIDER_ENCRYPTION_KEY;

    await expect(decryptApiKey('ciphertext')).rejects.toThrow(
      'Missing environment variable: AI_PROVIDER_ENCRYPTION_KEY',
    );
  });
});
