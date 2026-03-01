import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlugZap } from 'lucide-react';

// ---------------------------------------------------------------------------
// Static snippet shown to the user so they can wire up Claude Code /
// Claude Desktop using one of their API keys.
// ---------------------------------------------------------------------------

const CONFIG_SNIPPET = JSON.stringify(
  {
    mcpServers: {
      'my-prompts': {
        url: 'https://your-app-url/api/mcp',
        headers: { 'x-api-key': 'YOUR_KEY_HERE' },
      },
    },
  },
  null,
  2,
);

// ---------------------------------------------------------------------------
// Component — server component (no 'use client' needed)
// ---------------------------------------------------------------------------

export function McpConfigCard() {
  return (
    <Card className="w-full max-w-2xl bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <PlugZap className="size-5" />
          Connect to Claude Code
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Add this snippet to your{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            claude_desktop_config.json
          </code>{' '}
          (or Claude Code settings) to give your AI assistant direct access to
          your prompts. Replace{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            YOUR_KEY_HERE
          </code>{' '}
          with an API key created above.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <pre className="overflow-x-auto rounded-md border border-border bg-[#16161D] px-4 py-3 font-mono text-xs leading-relaxed text-[#DCD7BA]">
          {CONFIG_SNIPPET}
        </pre>

        <p className="mt-3 text-xs text-muted-foreground">
          Anonymous access (no key) returns public prompts only. Authenticated
          access returns all your prompts plus public ones.
        </p>
      </CardContent>
    </Card>
  );
}
