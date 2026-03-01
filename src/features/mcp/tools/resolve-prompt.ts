import { z } from 'zod';
import { extractVariables, resolvePrompt } from '@/lib/utils/variable-parser';
import { MCP_ERROR_CODES } from '../types';
import type { MCPToolHandler } from '../types';

// ---------------------------------------------------------------------------
// Parameter schema
// ---------------------------------------------------------------------------

const resolvePromptParamsSchema = z.object({
  prompt_id: z.string().uuid({ message: 'prompt_id must be a valid UUID' }),
  variables: z.record(z.string(), z.string()).optional(),
});

// ---------------------------------------------------------------------------
// DB row shape
// ---------------------------------------------------------------------------

interface DbResolvePromptRow {
  user_id: string;
  is_public: boolean;
  prompt_versions: {
    content: string;
    version_number: number;
  }[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * resolve_prompt tool handler.
 *
 * Fetches a prompt (same access rules as get_prompt) and substitutes
 * `{{variable}}` placeholders with the caller-supplied values. Any
 * placeholders without a matching value are left unchanged in the output.
 *
 * Returns:
 * - `resolved_content`: the template after substitution
 * - `unresolved_variables`: names of `{{var}}` placeholders that had no
 *   matching entry in the `variables` map (partial resolution is valid)
 *
 * Spec: spec/add-mcp-server-export/prompts — "MCP Prompt Resolution"
 */
export const handleResolvePrompt: MCPToolHandler = async (params, userId, supabase) => {
  // 1. Validate parameters
  const parsed = resolvePromptParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw {
      code: MCP_ERROR_CODES.INVALID_PARAMS,
      message: `Invalid parameters: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    };
  }

  const { prompt_id, variables = {} } = parsed.data;

  // 2. Fetch prompt — service-role bypasses RLS; we enforce access manually.
  const { data, error } = await supabase
    .from('prompts')
    .select(
      `
      user_id,
      is_public,
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

  const row = data as unknown as DbResolvePromptRow;

  // 3. Enforce access control (same rules as get_prompt)
  const isOwner = userId !== null && row.user_id === userId;
  const isPublic = row.is_public;

  if (!isOwner && !isPublic) {
    throw {
      code: MCP_ERROR_CODES.PROMPT_NOT_FOUND,
      message: 'Prompt not found.',
    };
  }

  // 4. Resolve latest version
  const versions = row.prompt_versions ?? [];
  const latestVersion = versions.sort((a, b) => b.version_number - a.version_number)[0];
  const content = latestVersion?.content ?? '';

  // 5. Identify all variables in the template before resolution
  const allVariables = extractVariables(content);

  // 6. Resolve — placeholders with no value remain as-is ({{name}})
  const resolved_content = resolvePrompt(content, variables);

  // 7. Determine which variables were not provided
  const unresolved_variables = allVariables.filter((name) => !(name in variables));

  return {
    resolved_content,
    unresolved_variables,
  };
};
