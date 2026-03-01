import { z } from 'zod';
import { extractVariables } from '@/lib/utils/variable-parser';
import { MCP_ERROR_CODES } from '../types';
import type { MCPToolHandler, MCPPromptEntry, ListPromptsResult } from '../types';

// ---------------------------------------------------------------------------
// Parameter schema
// ---------------------------------------------------------------------------

const listPromptsParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ---------------------------------------------------------------------------
// DB row shape returned by the query
// ---------------------------------------------------------------------------

interface DbListPromptRow {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  prompt_versions: {
    content: string;
    version_number: number;
  }[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * list_prompts tool handler.
 *
 * Returns paginated prompt metadata (no content body) for prompts visible to
 * the caller:
 * - Authenticated user: their own active prompts + other users' public prompts
 * - Anonymous (userId === null): only public prompts
 *
 * Archived prompts (`archived_at IS NOT NULL`) are always excluded.
 *
 * Spec: spec/add-mcp-server-export/prompts — "MCP Prompt Listing Projection"
 */
export const handleListPrompts: MCPToolHandler = async (params, userId, supabase) => {
  // 1. Validate parameters
  const parsed = listPromptsParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    throw {
      code: MCP_ERROR_CODES.INVALID_PARAMS,
      message: `Invalid parameters: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    };
  }

  const limit = parsed.data.limit ?? 20;
  const offset = parsed.data.offset ?? 0;

  // 2. Build query — service-role client so we can filter by user_id explicitly
  //    without relying on RLS cookies (unavailable in bearer-token context).
  let query = supabase
    .from('prompts')
    .select(
      `
      id,
      title,
      description,
      is_public,
      created_at,
      updated_at,
      prompt_versions (
        content,
        version_number
      )
    `,
    )
    .is('archived_at', null) // exclude archived
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    // Authenticated: own prompts OR public prompts from others
    query = query.or(`user_id.eq.${userId},is_public.eq.true`);
  } else {
    // Anonymous: public prompts only
    query = query.eq('is_public', true);
  }

  const { data, error } = await query;

  if (error) {
    throw {
      code: MCP_ERROR_CODES.INTERNAL_ERROR,
      message: `Failed to fetch prompts: ${error.message}`,
    };
  }

  const rows = (data ?? []) as unknown as DbListPromptRow[];

  // 3. Map to MCPPromptEntry — derive variables from latest version content
  const prompts: MCPPromptEntry[] = rows.map((row) => {
    const versions = row.prompt_versions ?? [];
    const latestVersion = versions.sort((a, b) => b.version_number - a.version_number)[0];
    const content = latestVersion?.content ?? '';

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      variables: extractVariables(content),
    };
  });

  const result: ListPromptsResult = { prompts };
  return result;
};
