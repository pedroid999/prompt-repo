/**
 * MCP API Route Handler
 *
 * Exposes the JSON-RPC 2.0 MCP endpoint at POST /api/mcp.
 *
 * Authentication is handled via API keys (not session cookies):
 * - `Authorization: Bearer <key>` header (preferred)
 * - `x-api-key: <key>` header (fallback)
 *
 * If no key is provided the caller is treated as anonymous (public prompts only).
 * A key that is present but invalid/revoked yields a JSON-RPC error — the HTTP
 * status is always 200 because JSON-RPC errors travel inside the envelope.
 *
 * CORS headers are added to every response so that MCP clients running in
 * different origins (e.g. Claude Desktop, browser-based agents) can call this
 * endpoint without being blocked.
 *
 * Spec: spec/add-mcp-server-export/mcp — "MCP Endpoint Behaviour"
 * Design: design/add-mcp-server-export — "Route Handler"
 */

import { verifyApiKey } from '@/lib/api-keys/verify';
import { mcpRequestSchema } from '@/lib/validation/mcp';
import { MCP_ERROR_CODES } from '@/features/mcp/types';
import { dispatch } from '@/features/mcp/dispatcher';

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/** Builds a JSON-RPC error envelope with HTTP 200 and CORS headers. */
function rpcError(
  id: string | number | null,
  code: number,
  message: string,
): Response {
  return jsonResponse({ jsonrpc: '2.0', id, error: { code, message } });
}

// ---------------------------------------------------------------------------
// OPTIONS — preflight handler
// ---------------------------------------------------------------------------

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// ---------------------------------------------------------------------------
// POST — main handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // -------------------------------------------------------------------------
  // Step 1: Resolve caller identity from API key headers
  // -------------------------------------------------------------------------
  let userId: string | null = null;

  const authHeader = request.headers.get('Authorization');
  const xApiKeyHeader = request.headers.get('x-api-key');

  // Prefer `Authorization: Bearer <key>` over `x-api-key`.
  const rawKey =
    authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : (xApiKeyHeader?.trim() ?? null);

  if (rawKey) {
    // A key was supplied — validate it.
    const result = await verifyApiKey(rawKey);
    if (!result.valid) {
      // Key is present but invalid or revoked — return JSON-RPC error.
      // HTTP status is 200 per JSON-RPC convention; the error is in the envelope.
      return rpcError(null, MCP_ERROR_CODES.INVALID_API_KEY, 'Invalid API key.');
    }
    userId = result.userId;
  }
  // If no key header is present, userId stays null → anonymous access (public prompts only).

  // -------------------------------------------------------------------------
  // Step 2: Parse request body
  // -------------------------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return rpcError(null, MCP_ERROR_CODES.PARSE_ERROR, 'Parse error: request body is not valid JSON.');
  }

  // -------------------------------------------------------------------------
  // Step 3: Validate against JSON-RPC 2.0 envelope schema
  // -------------------------------------------------------------------------
  const parsed = mcpRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    // Extract `id` from the raw body for the error envelope if possible.
    const rawId =
      rawBody !== null &&
      typeof rawBody === 'object' &&
      'id' in (rawBody as object)
        ? ((rawBody as Record<string, unknown>).id as string | number | null)
        : null;

    return rpcError(
      rawId,
      MCP_ERROR_CODES.INVALID_REQUEST,
      `Invalid Request: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  // -------------------------------------------------------------------------
  // Step 4: Dispatch to the appropriate tool handler
  // -------------------------------------------------------------------------
  const mcpRequest = parsed.data;
  const mcpResponse = await dispatch(mcpRequest, userId);

  // -------------------------------------------------------------------------
  // Step 5: Return JSON-RPC response (always HTTP 200)
  // -------------------------------------------------------------------------
  return jsonResponse(mcpResponse);
}
