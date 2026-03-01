/**
 * API key generation and hashing utilities.
 *
 * Both functions run in Node.js 20+ (Next.js server runtime).
 * They use the Web Crypto API (available globally in Node 20+ as `globalThis.crypto`),
 * which also works in the Vercel Edge Runtime should the MCP route ever be moved there.
 */

/**
 * Generates a cryptographically secure random API key.
 * Returns 32 random bytes encoded as a lowercase hex string (64 characters).
 * This gives 256 bits of entropy, satisfying the spec requirement.
 */
export function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes the SHA-256 hash of a plaintext API key.
 * Returns the hash as a lowercase hex string.
 * This is the value stored in the database — the plaintext is never persisted.
 */
export async function hashApiKey(plaintext: string): Promise<string> {
  const encoded = new TextEncoder().encode(plaintext);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
