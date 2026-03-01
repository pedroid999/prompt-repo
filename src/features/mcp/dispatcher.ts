/**
 * MCP JSON-RPC 2.0 Dispatcher
 *
 * Maps every supported MCP method name to its handler function, then
 * executes the matched handler and wraps the result in a JSON-RPC 2.0
 * response envelope.
 *
 * All prompt-tool handlers require a service-role Supabase client, which is
 * created once per dispatch call and passed down to each handler.
 *
 * Spec: spec/add-mcp-server-export/mcp — "MCP Endpoint Behaviour"
 * Design: design/add-mcp-server-export — "Dispatcher Layer"
 */

import { createServiceClient } from '@/lib/supabase/service';
import {
  MCP_ERROR_CODES,
  type MCPErrorResponse,
  type MCPRequest,
  type MCPResponse,
  type MCPToolHandler,
} from './types';
import {
  handleGetPrompt,
  handleInitialize,
  handleListPrompts,
  handleListTools,
  handleResolvePrompt,
  handleSearchPrompts,
} from './tools';

// ---------------------------------------------------------------------------
// Handlers that do NOT need (params, userId, supabase) — adapters below
// ---------------------------------------------------------------------------

/**
 * Adapter: handleInitialize does not need params/userId/supabase — it returns
 * a static capabilities object. We wrap it so it fits the MCPToolHandler shape.
 */
const initializeAdapter: MCPToolHandler = async () => handleInitialize();

/**
 * Adapter: handleListTools does not need params/userId/supabase — it returns
 * the static tool catalogue. We wrap it so it fits the MCPToolHandler shape.
 */
const listToolsAdapter: MCPToolHandler = async () => handleListTools();

// ---------------------------------------------------------------------------
// tools/call adapter
// ---------------------------------------------------------------------------

/**
 * Maps MCP tool names (as declared in tools/list) to their handler functions.
 * Used by the tools/call dispatcher to route by name.
 */
const TOOL_HANDLER_MAP: Record<string, MCPToolHandler> = {
  list_prompts: handleListPrompts,
  get_prompt: handleGetPrompt,
  resolve_prompt: handleResolvePrompt,
  search_prompts: handleSearchPrompts,
};

/**
 * Adapter for the standard MCP `tools/call` method.
 * Extracts `name` and `arguments` from params, routes to the matching handler,
 * and wraps the result in the MCP content-block format expected by clients.
 */
const toolsCallAdapter: MCPToolHandler = async (params, userId, supabase) => {
  const p = params as { name?: string; arguments?: unknown } | null;
  const toolName = p?.name;

  if (!toolName) {
    throw { code: MCP_ERROR_CODES.INVALID_PARAMS, message: 'tools/call requires a "name" parameter.' };
  }

  const handler = TOOL_HANDLER_MAP[toolName];
  if (!handler) {
    throw { code: MCP_ERROR_CODES.METHOD_NOT_FOUND, message: `Unknown tool: ${toolName}` };
  }

  const result = await handler(p?.arguments ?? null, userId, supabase);

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    isError: false,
  };
};

// ---------------------------------------------------------------------------
// Static dispatch map
// ---------------------------------------------------------------------------

/**
 * Maps JSON-RPC method names to their handler functions.
 *
 * Method naming follows the MCP protocol convention for lifecycle methods
 * (`initialize`, `tools/list`, `tools/call`) and also retains the legacy
 * `prompts/` prefix methods for backwards compatibility.
 */
const DISPATCH_MAP: Record<string, MCPToolHandler> = {
  initialize: initializeAdapter,
  'tools/list': listToolsAdapter,
  'tools/call': toolsCallAdapter,
  'prompts/list': handleListPrompts,
  'prompts/get': handleGetPrompt,
  'prompts/resolve': handleResolvePrompt,
  'prompts/search': handleSearchPrompts,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMCPError(value: unknown): value is { code: number; message: string; data?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).code === 'number' &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

function makeErrorResponse(
  id: MCPRequest['id'],
  code: number,
  message: string,
  data?: unknown,
): MCPErrorResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  };
}

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

/**
 * Dispatches an MCPRequest to the appropriate handler and returns a
 * JSON-RPC 2.0 response (either a result envelope or an error envelope).
 *
 * Never throws — all errors are caught and returned as JSON-RPC error objects.
 *
 * @param request  Validated MCPRequest parsed from the incoming HTTP body.
 * @param userId   The authenticated user's UUID, or null for anonymous callers.
 */
export async function dispatch(
  request: MCPRequest,
  userId: string | null,
): Promise<MCPResponse | MCPErrorResponse> {
  const handler = DISPATCH_MAP[request.method];

  // Method not found
  if (!handler) {
    return makeErrorResponse(
      request.id,
      MCP_ERROR_CODES.METHOD_NOT_FOUND,
      `Method not found: ${request.method}`,
    );
  }

  // Create a service-role Supabase client for this request.
  // The singleton is reused across calls within the same process (see service.ts).
  const supabase = createServiceClient();

  try {
    const result = await handler(request.params ?? null, userId, supabase);

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id,
      result,
    };

    return response;
  } catch (err: unknown) {
    // Known MCPError shape thrown by tool handlers
    if (isMCPError(err)) {
      return makeErrorResponse(request.id, err.code, err.message, err.data);
    }

    // Unexpected error — log server-side, return opaque INTERNAL_ERROR
    console.error('[MCP dispatcher] Unexpected error for method', request.method, err);

    return makeErrorResponse(
      request.id,
      MCP_ERROR_CODES.INTERNAL_ERROR,
      'An internal server error occurred.',
    );
  }
}
