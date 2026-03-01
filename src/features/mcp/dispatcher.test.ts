import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase service client
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}));

// Mock all tool handlers so the dispatcher can be tested in isolation
vi.mock('./tools', () => ({
  handleInitialize: vi.fn(),
  handleListTools: vi.fn(),
  handleListPrompts: vi.fn(),
  handleGetPrompt: vi.fn(),
  handleResolvePrompt: vi.fn(),
  handleSearchPrompts: vi.fn(),
}));

import { dispatch } from './dispatcher';
import { MCP_ERROR_CODES, type MCPRequest } from './types';
import {
  handleListPrompts,
  handleResolvePrompt,
  handleInitialize,
  handleListTools,
} from './tools';
import { createServiceClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(method: string, params?: unknown, id: string | number | null = 1): MCPRequest {
  return { jsonrpc: '2.0', id, method, params };
}

const fakeSupabase = {} as never;

describe('dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceClient).mockReturnValue(fakeSupabase);
  });

  // -------------------------------------------------------------------------
  // Happy path — known method is routed to correct handler
  // -------------------------------------------------------------------------

  it('routes prompts/list to handleListPrompts and wraps the result', async () => {
    const expectedResult = { prompts: [] };
    vi.mocked(handleListPrompts).mockResolvedValue(expectedResult);

    const request = makeRequest('prompts/list', { limit: 10 });
    const response = await dispatch(request, 'user-abc');

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: request.id,
      result: expectedResult,
    });
    expect(handleListPrompts).toHaveBeenCalledWith({ limit: 10 }, 'user-abc', fakeSupabase);
  });

  it('routes prompts/resolve to handleResolvePrompt with correct args', async () => {
    const expectedResult = { resolved_content: 'Hello World', unresolved_variables: [] };
    vi.mocked(handleResolvePrompt).mockResolvedValue(expectedResult);

    const params = { prompt_id: '550e8400-e29b-41d4-a716-446655440000', variables: { name: 'World' } };
    const request = makeRequest('prompts/resolve', params);
    const response = await dispatch(request, null);

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: request.id,
      result: expectedResult,
    });
    expect(handleResolvePrompt).toHaveBeenCalledWith(params, null, fakeSupabase);
  });

  it('passes null params when request has no params field', async () => {
    vi.mocked(handleListPrompts).mockResolvedValue({ prompts: [] });

    const request: MCPRequest = { jsonrpc: '2.0', id: 2, method: 'prompts/list' };
    await dispatch(request, null);

    expect(handleListPrompts).toHaveBeenCalledWith(null, null, fakeSupabase);
  });

  // -------------------------------------------------------------------------
  // Static adapters (initialize / tools/list) — no supabase needed
  // -------------------------------------------------------------------------

  it('routes initialize to handleInitialize (adapter wraps it)', async () => {
    vi.mocked(handleInitialize).mockResolvedValue({ protocolVersion: '2024-11-05' });

    const request = makeRequest('initialize');
    const response = await dispatch(request, null);

    expect(response).toMatchObject({ jsonrpc: '2.0', id: request.id });
    expect('result' in response).toBe(true);
    expect(handleInitialize).toHaveBeenCalled();
  });

  it('routes tools/list to handleListTools (adapter wraps it)', async () => {
    vi.mocked(handleListTools).mockResolvedValue({ tools: [] });

    const request = makeRequest('tools/list');
    const response = await dispatch(request, null);

    expect(response).toMatchObject({ jsonrpc: '2.0', id: request.id });
    expect('result' in response).toBe(true);
    expect(handleListTools).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Unknown method → METHOD_NOT_FOUND
  // -------------------------------------------------------------------------

  it('returns METHOD_NOT_FOUND error for an unknown method', async () => {
    const request = makeRequest('prompts/unknown');
    const response = await dispatch(request, null);

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: MCP_ERROR_CODES.METHOD_NOT_FOUND,
        message: expect.stringContaining('prompts/unknown'),
      },
    });
  });

  it('does not call createServiceClient when method is unknown', async () => {
    await dispatch(makeRequest('nope'), null);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Handler throws MCPError shape → error response with that code
  // -------------------------------------------------------------------------

  it('returns the MCPError code when a handler throws an MCPError-shaped object', async () => {
    const mcpError = { code: MCP_ERROR_CODES.INVALID_PARAMS, message: 'bad params' };
    vi.mocked(handleListPrompts).mockRejectedValue(mcpError);

    const response = await dispatch(makeRequest('prompts/list'), null);

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: MCP_ERROR_CODES.INVALID_PARAMS,
        message: 'bad params',
      },
    });
  });

  it('includes optional data field when MCPError provides it', async () => {
    const mcpError = { code: MCP_ERROR_CODES.PROMPT_NOT_FOUND, message: 'not found', data: { extra: true } };
    vi.mocked(handleResolvePrompt).mockRejectedValue(mcpError);

    const response = await dispatch(makeRequest('prompts/resolve'), null);

    expect(response).toMatchObject({
      error: { code: MCP_ERROR_CODES.PROMPT_NOT_FOUND, data: { extra: true } },
    });
  });

  // -------------------------------------------------------------------------
  // Handler throws unknown error → INTERNAL_ERROR
  // -------------------------------------------------------------------------

  it('returns INTERNAL_ERROR when a handler throws a non-MCPError (plain Error)', async () => {
    vi.mocked(handleListPrompts).mockRejectedValue(new Error('database went boom'));

    const response = await dispatch(makeRequest('prompts/list'), null);

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: MCP_ERROR_CODES.INTERNAL_ERROR,
        message: 'An internal server error occurred.',
      },
    });
  });

  it('returns INTERNAL_ERROR for a thrown primitive string', async () => {
    vi.mocked(handleListPrompts).mockRejectedValue('something bad');

    const response = await dispatch(makeRequest('prompts/list'), null);

    expect(response).toMatchObject({
      error: { code: MCP_ERROR_CODES.INTERNAL_ERROR },
    });
  });

  // -------------------------------------------------------------------------
  // Response id propagation
  // -------------------------------------------------------------------------

  it('preserves null id in error responses', async () => {
    const response = await dispatch(makeRequest('nonexistent', undefined, null), null);
    expect(response).toMatchObject({ id: null });
  });

  it('preserves string id in success responses', async () => {
    vi.mocked(handleListPrompts).mockResolvedValue({ prompts: [] });
    const response = await dispatch(makeRequest('prompts/list', undefined, 'req-99'), null);
    expect(response).toMatchObject({ id: 'req-99' });
  });
});
