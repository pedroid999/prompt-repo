// NOTE: This module must ONLY be imported from server-side code (Server Actions,
// Route Handlers, server components). It relies on SUPABASE_SERVICE_ROLE_KEY which
// is intentionally absent from the browser bundle. Importing it from a Client
// Component will expose the service-role key and bypass RLS — never do that.

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let _cachedClient: SupabaseClient | null = null;
let _cachedUrl: string | undefined;
let _cachedKey: string | undefined;

/**
 * Returns a singleton Supabase client authenticated with the service-role key.
 * This client bypasses RLS and is intended for server-side operations that need
 * to act on behalf of any user (e.g. MCP API-key validation).
 *
 * The singleton is recreated if the environment variables change (e.g. in tests).
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!key) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  // Re-create the client if env vars have changed (useful in test environments).
  if (_cachedClient && _cachedUrl === url && _cachedKey === key) {
    return _cachedClient;
  }

  _cachedClient = createSupabaseClient(url, key, {
    auth: {
      // Service-role clients must not persist session state.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  _cachedUrl = url;
  _cachedKey = key;

  return _cachedClient;
}
