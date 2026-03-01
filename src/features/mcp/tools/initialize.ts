/**
 * MCP initialize handler.
 *
 * Called when an MCP client sends the `initialize` method. Returns the
 * protocol version, server metadata, and declared capabilities so the client
 * can negotiate the session.
 *
 * Spec: spec/add-mcp-server-export/mcp — "Tool Discovery (initialize / tools/list)"
 */
export function handleInitialize(): unknown {
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: 'prompt-repo',
      version: '1.0.0',
    },
  };
}
