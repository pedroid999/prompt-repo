// ---------------------------------------------------------------------------
// Encryption helpers for AI provider API keys.
//
// Keys are encrypted/decrypted using pgcrypto's pgp_sym_encrypt/pgp_sym_decrypt
// via raw SQL through the Supabase service-role client. The symmetric passphrase
// is read from the AI_PROVIDER_ENCRYPTION_KEY environment variable and MUST
// never be exposed to the browser.
//
// NOTE: This module must ONLY be imported from server-side code (Server Actions,
// Route Handlers). It relies on AI_PROVIDER_ENCRYPTION_KEY which is intentionally
// absent from the browser bundle.
// ---------------------------------------------------------------------------

import { createServiceClient } from '@/lib/supabase/service';

/**
 * Returns the pgcrypto passphrase from the environment.
 * Throws if not configured.
 */
function getEncryptionKey(): string {
  const key = process.env.AI_PROVIDER_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable: AI_PROVIDER_ENCRYPTION_KEY. ' +
        'This is required to encrypt/decrypt AI provider API keys.',
    );
  }
  return key;
}

/**
 * Encrypt an API key using pgcrypto `pgp_sym_encrypt`.
 * Returns the encrypted ciphertext string suitable for storing in the
 * `encrypted_api_key` column.
 */
export async function encryptApiKey(plaintext: string): Promise<string> {
  const supabase = createServiceClient();
  const passphrase = getEncryptionKey();

  const { data, error } = await supabase.rpc('pgp_sym_encrypt_text', {
    plaintext_value: plaintext,
    passphrase_value: passphrase,
  });

  if (error) {
    throw new Error(`Failed to encrypt API key: ${error.message}`);
  }

  return data as string;
}

/**
 * Decrypt an API key using pgcrypto `pgp_sym_decrypt`.
 * Returns the plaintext API key for use in LLM API calls.
 */
export async function decryptApiKey(ciphertext: string): Promise<string> {
  const supabase = createServiceClient();
  const passphrase = getEncryptionKey();

  const { data, error } = await supabase.rpc('pgp_sym_decrypt_text', {
    ciphertext_value: ciphertext,
    passphrase_value: passphrase,
  });

  if (error) {
    throw new Error(`Failed to decrypt API key: ${error.message}`);
  }

  return data as string;
}

/**
 * Mask an API key for display purposes.
 * Shows the first 3 and last 3 characters, with "..." in between.
 * Returns null for null/undefined input.
 *
 * Examples:
 *   "sk-ant-api03-abcdef...xyz" -> "sk-...xyz"
 *   "short" -> "sho...ort"
 */
export function maskApiKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 6) return `${key.slice(0, 3)}...`;
  return `${key.slice(0, 3)}...${key.slice(-3)}`;
}
