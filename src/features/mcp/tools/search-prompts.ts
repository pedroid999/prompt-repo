import { z } from 'zod';
import { extractVariables } from '@/lib/utils/variable-parser';
import { MCP_ERROR_CODES } from '../types';
import type { MCPToolHandler, MCPPromptEntry, SearchPromptsResult } from '../types';

// ---------------------------------------------------------------------------
// Parameter schema
// ---------------------------------------------------------------------------

const searchPromptsParamsSchema = z.object({
  query: z.string().min(1, 'query must be at least 1 character'),
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

// ---------------------------------------------------------------------------
// RPC result row shape (mirrors SearchResult from src/features/search/types.ts)
// ---------------------------------------------------------------------------

interface DbSearchRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  archived_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  latest_content: string;
  latest_version_id: string;
  collection_ids: string[];
  rank: number;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * search_prompts tool handler.
 *
 * Executes a PostgreSQL full-text search using the existing `search_prompts`
 * database RPC function (same one used by the UI search feature). Results are
 * filtered to the caller's accessible prompts:
 * - Authenticated user: their own prompts + public prompts from others
 * - Anonymous caller: only public prompts
 *
 * Returns prompt metadata matching the list_prompts projection (no content).
 *
 * Spec: spec/add-mcp-server-export/prompts — "MCP Prompt Search"
 * Pattern: adapted from src/features/search/actions.ts
 */
export const handleSearchPrompts: MCPToolHandler = async (params, userId, supabase) => {
  // 1. Validate parameters
  const parsed = searchPromptsParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw {
      code: MCP_ERROR_CODES.INVALID_PARAMS,
      message: `Invalid parameters: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    };
  }

  const query = parsed.data.query.trim();
  const limit = parsed.data.limit ?? 10;

  // 2. Execute full-text search via the existing RPC function.
  //    The service-role client is used so we can post-filter results without
  //    relying on cookie-based RLS sessions.
  //
  //    The existing `search_prompts` RPC accepts:
  //      query_text        text
  //      filter_user_id    uuid | null
  //      filter_collection_id uuid | null
  //      filter_archived   bool | null
  //
  //    We pass filter_user_id = null to get all rows (user + public); access
  //    control is enforced below on the returned result set.
  const { data, error } = await supabase.rpc('search_prompts', {
    query_text: query,
    filter_user_id: null,   // fetch everything; filter access manually below
    filter_collection_id: null,
    filter_archived: false, // never include archived results
  });

  if (error) {
    throw {
      code: MCP_ERROR_CODES.INTERNAL_ERROR,
      message: `Search failed: ${error.message}`,
    };
  }

  const rows = (data ?? []) as DbSearchRow[];

  // 3. Apply access control and limit
  //    - Authenticated: include rows where user_id matches OR is_public is true
  //    - Anonymous: include only public rows
  const visible = rows.filter((row) => {
    if (userId !== null && row.user_id === userId) return true; // own prompt
    return row.is_public;
  });

  const limited = visible.slice(0, limit);

  // 4. Map to MCPPromptEntry (no content; extract variables from latest_content)
  const prompts: MCPPromptEntry[] = limited.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    variables: extractVariables(row.latest_content ?? ''),
  }));

  const result: SearchPromptsResult = { prompts };
  return result;
};
