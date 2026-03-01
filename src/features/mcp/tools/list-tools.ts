import type { MCPToolDefinition } from '../types';

/**
 * MCP tools/list handler.
 *
 * Returns the static catalogue of all tools this MCP server exposes.
 * Each definition includes a JSON Schema `inputSchema` so MCP clients can
 * generate typed parameter prompts.
 *
 * Spec: spec/add-mcp-server-export/mcp — "Tool Discovery (initialize / tools/list)"
 */
export function handleListTools(): { tools: MCPToolDefinition[] } {
  const tools: MCPToolDefinition[] = [
    {
      name: 'list_prompts',
      description:
        'List prompts accessible to the authenticated user. Returns a paginated list of prompt metadata (no content body). Includes the user\'s own active prompts and public prompts from other users. Anonymous callers receive only public prompts.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Maximum number of prompts to return (1–100). Defaults to 20.',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          offset: {
            type: 'integer',
            description: 'Number of prompts to skip for pagination. Defaults to 0.',
            minimum: 0,
            default: 0,
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
    {
      name: 'get_prompt',
      description:
        'Fetch a single prompt by ID, including its latest version content and extracted variable names. Authenticated users can access their own prompts (public or private) and other users\' public prompts. Anonymous callers can access only public prompts.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt_id: {
            type: 'string',
            description: 'The UUID of the prompt to fetch.',
          },
        },
        required: ['prompt_id'],
        additionalProperties: false,
      },
    },
    {
      name: 'resolve_prompt',
      description:
        'Fetch a prompt and resolve its {{variable}} placeholders with the provided values. Any variables without a supplied value are left as-is in the output. Returns the resolved content and a list of any variables that were not provided.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt_id: {
            type: 'string',
            description: 'The UUID of the prompt to resolve.',
          },
          variables: {
            type: 'object',
            description: 'Map of variable names to their replacement values.',
            additionalProperties: {
              type: 'string',
            },
          },
        },
        required: ['prompt_id'],
        additionalProperties: false,
      },
    },
    {
      name: 'search_prompts',
      description:
        'Full-text search over prompts accessible to the caller. Authenticated users search their own prompts and public prompts from others. Anonymous callers search only public prompts. Returns prompt metadata without content.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string (minimum 1 character).',
            minLength: 1,
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of results to return (1–50). Defaults to 10.',
            minimum: 1,
            maximum: 50,
            default: 10,
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  ];

  return { tools };
}
