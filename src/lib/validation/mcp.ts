import { z } from 'zod';

/** Validates the JSON-RPC 2.0 request envelope.
 *  Per the spec, `id` may be a string, number, or null.
 *  `params` is optional and left as `unknown` — tools validate their own params. */
export const mcpRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]),
  method: z.string().min(1, 'method is required'),
  params: z.unknown().optional(),
});

export type MCPRequestInput = z.infer<typeof mcpRequestSchema>;
