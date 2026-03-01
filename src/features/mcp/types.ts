import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 envelope types
// ---------------------------------------------------------------------------

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: unknown;
}

export interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
  result: T;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPErrorResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  error: MCPError;
}

// ---------------------------------------------------------------------------
// Tool dispatch types
// ---------------------------------------------------------------------------

/** A tool handler receives parsed params, the resolved user ID, and a service-role
 *  Supabase client. It returns the tool's result (serialised as JSON by the dispatcher). */
export type MCPToolHandler = (
  params: unknown,
  userId: string | null,
  supabase: SupabaseClient,
) => Promise<unknown>;

export interface MCPToolDefinition {
  name: string;
  description: string;
  /** JSON Schema object describing the tool's input. */
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Tool result shapes
// ---------------------------------------------------------------------------

export interface MCPPromptEntry {
  id: string;
  title: string;
  description: string | null;
  variables: string[];
}

export interface ListPromptsResult {
  prompts: MCPPromptEntry[];
}

export interface GetPromptResult {
  id: string;
  title: string;
  description: string | null;
  content: string;
  variables: string[];
}

export interface ResolvePromptResult {
  id: string;
  title: string;
  resolved_content: string;
}

export interface SearchPromptsResult {
  prompts: MCPPromptEntry[];
}

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 standard error codes + application-level extensions
// ---------------------------------------------------------------------------

export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Application-level errors (outside the reserved -32768 … -32000 range
  // according to the JSON-RPC spec, so we use the lower end of that range
  // for application errors as is conventional).
  INVALID_API_KEY: -32001,
  PROMPT_NOT_FOUND: -32002,
} as const;

export type MCPErrorCode = (typeof MCP_ERROR_CODES)[keyof typeof MCP_ERROR_CODES];
