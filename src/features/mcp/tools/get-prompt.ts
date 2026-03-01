import { z } from 'zod';
import { extractVariables } from '@/lib/utils/variable-parser';
import { MCP_ERROR_CODES } from '../types';
import type { MCPToolHandler, GetPromptResult } from '../types';

// ---------------------------------------------------------------------------
// Parameter schema
// ---------------------------------------------------------------------------

const getPromptParamsSchema = z.object({
  prompt_id: z.string().uuid({ message: 'prompt_id must be a valid UUID' }),
});

// ---------------------------------------------------------------------------
// DB row shape
// ---------------------------------------------------------------------------

interface DbGetPromptRow {
  id: string;
  user_id: string;
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
 * get_prompt tool handler.
 *
 * Fetches a single prompt by ID including its latest version content and the
 * variable names extracted from that content.
 *
 * Access control:
 * - Authenticated user: can access their own prompts (public or private) OR
 *   any other user's public prompt.
 * - Anonymous caller: only public prompts (`is_public = true`).
 * - Private prompt belonging to another user → PROMPT_NOT_FOUND (do not
 *   reveal its existence to avoid enumeration attacks).
 *
 * Spec: spec/add-mcp-server-export/prompts — "MCP Prompt Fetch"
 */
export const handleGetPrompt: MCPToolHandler = async (params, userId, supabase) => {
  // 1. Validate parameters
  const parsed = getPromptParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw {
      code: MCP_ERROR_CODES.INVALID_PARAMS,
      message: `Invalid parameters: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    };
  }

  const { prompt_id } = parsed.data;

  // 2. Fetch prompt — service-role bypasses RLS; we enforce access manually.
  const { data, error } = await supabase
    .from('prompts')
    .select(
      `
      id,
      user_id,
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
    .eq('id', prompt_id)
    .maybeSingle();

  if (error) {
    throw {
      code: MCP_ERROR_CODES.INTERNAL_ERROR,
      message: `Failed to fetch prompt: ${error.message}`,
    };
  }

  if (!data) {
    throw {
      code: MCP_ERROR_CODES.PROMPT_NOT_FOUND,
      message: 'Prompt not found.',
    };
  }

  const row = data as unknown as DbGetPromptRow;

  // 3. Enforce access control
  const isOwner = userId !== null && row.user_id === userId;
  const isPublic = row.is_public;

  if (!isOwner && !isPublic) {
    // Return NOT_FOUND rather than FORBIDDEN to avoid revealing existence.
    throw {
      code: MCP_ERROR_CODES.PROMPT_NOT_FOUND,
      message: 'Prompt not found.',
    };
  }

  // 4. Resolve latest version
  const versions = row.prompt_versions ?? [];
  const latestVersion = versions.sort((a, b) => b.version_number - a.version_number)[0];
  const content = latestVersion?.content ?? '';
  const versionNumber = latestVersion?.version_number ?? 0;

  const result: GetPromptResult & {
    is_public: boolean;
    version_number: number;
    created_at: string;
    updated_at: string;
  } = {
    id: row.id,
    title: row.title,
    description: row.description,
    content,
    is_public: row.is_public,
    variables: extractVariables(content),
    version_number: versionNumber,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return result;
};
