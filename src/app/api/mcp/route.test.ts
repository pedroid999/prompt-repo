import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api-keys/verify', () => ({
  verifyApiKey: vi.fn(),
}));

vi.mock('@/features/mcp/dispatcher', () => ({
  dispatch: vi.fn(),
}));

import { POST, OPTIONS } from './route';
import { verifyApiKey } from '@/lib/api-keys/verify';
import { dispatch } from '@/features/mcp/dispatcher';
import { MCP_ERROR_CODES } from '@/features/mcp/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_RPC_BODY = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'prompts/list',
  params: {},
});

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  });
}

async function parseJson(response: Response) {
  return response.json();
}

const MOCK_RPC_RESULT = { jsonrpc: '2.0', id: 1, result: { prompts: [] } };

describe('OPTIONS /api/mcp', () => {
  it('returns HTTP 200', async () => {
    const response = await OPTIONS();
    expect(response.status).toBe(200);
  });

  it('includes Access-Control-Allow-Origin: * header', async () => {
    const response = await OPTIONS();
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes Access-Control-Allow-Methods header', async () => {
    const response = await OPTIONS();
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
  });

  it('includes Access-Control-Allow-Headers header', async () => {
    const response = await OPTIONS();
    const allowedHeaders = response.headers.get('Access-Control-Allow-Headers') ?? '';
    expect(allowedHeaders).toContain('Authorization');
    expect(allowedHeaders).toContain('x-api-key');
  });
});

describe('POST /api/mcp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dispatch).mockResolvedValue(MOCK_RPC_RESULT as never);
  });

  // -------------------------------------------------------------------------
  // Authentication — no key provided
  // -------------------------------------------------------------------------

  it('calls dispatch with userId=null when no auth header is present', async () => {
    const request = makeRequest(VALID_RPC_BODY);
    await POST(request);

    expect(verifyApiKey).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'prompts/list' }),
      null,
    );
  });

  // -------------------------------------------------------------------------
  // Authentication — Bearer token
  // -------------------------------------------------------------------------

  it('calls verifyApiKey with extracted Bearer token', async () => {
    vi.mocked(verifyApiKey).mockResolvedValue({ valid: true, userId: 'user-bearer' });

    const request = makeRequest(VALID_RPC_BODY, { Authorization: 'Bearer my-secret-key' });
    await POST(request);

    expect(verifyApiKey).toHaveBeenCalledWith('my-secret-key');
    expect(dispatch).toHaveBeenCalledWith(
      expect.anything(),
      'user-bearer',
    );
  });

  // -------------------------------------------------------------------------
  // Authentication — x-api-key header
  // -------------------------------------------------------------------------

  it('calls verifyApiKey with x-api-key when no Bearer is present', async () => {
    vi.mocked(verifyApiKey).mockResolvedValue({ valid: true, userId: 'user-xkey' });

    const request = makeRequest(VALID_RPC_BODY, { 'x-api-key': 'xkey-value' });
    await POST(request);

    expect(verifyApiKey).toHaveBeenCalledWith('xkey-value');
    expect(dispatch).toHaveBeenCalledWith(expect.anything(), 'user-xkey');
  });

  // -------------------------------------------------------------------------
  // Authentication — both headers present (Bearer preferred)
  // -------------------------------------------------------------------------

  it('prefers Bearer token over x-api-key when both are present', async () => {
    vi.mocked(verifyApiKey).mockResolvedValue({ valid: true, userId: 'user-bearer' });

    const request = makeRequest(VALID_RPC_BODY, {
      Authorization: 'Bearer bearer-wins',
      'x-api-key': 'xkey-loses',
    });
    await POST(request);

    expect(verifyApiKey).toHaveBeenCalledWith('bearer-wins');
    expect(verifyApiKey).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Authentication — invalid key
  // -------------------------------------------------------------------------

  it('returns JSON-RPC error -32001 for invalid API key without calling dispatch', async () => {
    vi.mocked(verifyApiKey).mockResolvedValue({ valid: false });

    const request = makeRequest(VALID_RPC_BODY, { Authorization: 'Bearer bad-key' });
    const response = await POST(request);
    const body = await parseJson(response);

    expect(response.status).toBe(200);
    expect(body.error.code).toBe(MCP_ERROR_CODES.INVALID_API_KEY);
    expect(dispatch).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Parse errors
  // -------------------------------------------------------------------------

  it('returns JSON-RPC -32700 for malformed (non-JSON) request body', async () => {
    const request = makeRequest('this is not json');
    const response = await POST(request);
    const body = await parseJson(response);

    expect(response.status).toBe(200);
    expect(body.error.code).toBe(MCP_ERROR_CODES.PARSE_ERROR);
    expect(dispatch).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Invalid JSON-RPC envelope
  // -------------------------------------------------------------------------

  it('returns JSON-RPC -32600 for valid JSON that fails envelope schema', async () => {
    const invalidEnvelope = JSON.stringify({ jsonrpc: '1.0', id: 1 }); // wrong version, missing method
    const request = makeRequest(invalidEnvelope);
    const response = await POST(request);
    const body = await parseJson(response);

    expect(response.status).toBe(200);
    expect(body.error.code).toBe(MCP_ERROR_CODES.INVALID_REQUEST);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('includes the raw id in the invalid-request error envelope when parseable', async () => {
    const withId = JSON.stringify({ jsonrpc: '2.0', id: 42 }); // missing `method`
    const request = makeRequest(withId);
    const response = await POST(request);
    const body = await parseJson(response);

    expect(body.id).toBe(42);
    expect(body.error.code).toBe(MCP_ERROR_CODES.INVALID_REQUEST);
  });

  // -------------------------------------------------------------------------
  // Successful dispatch
  // -------------------------------------------------------------------------

  it('returns HTTP 200 with the dispatch result', async () => {
    const request = makeRequest(VALID_RPC_BODY);
    const response = await POST(request);
    const body = await parseJson(response);

    expect(response.status).toBe(200);
    expect(body).toEqual(MOCK_RPC_RESULT);
  });

  // -------------------------------------------------------------------------
  // CORS headers on every response
  // -------------------------------------------------------------------------

  it('sets Content-Type: application/json on successful response', async () => {
    const request = makeRequest(VALID_RPC_BODY);
    const response = await POST(request);
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('sets Access-Control-Allow-Origin: * on successful response', async () => {
    const request = makeRequest(VALID_RPC_BODY);
    const response = await POST(request);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('sets Access-Control-Allow-Origin: * on error responses', async () => {
    const request = makeRequest('bad-json');
    const response = await POST(request);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('sets Content-Type: application/json on error responses', async () => {
    const request = makeRequest('bad-json');
    const response = await POST(request);
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });
});
