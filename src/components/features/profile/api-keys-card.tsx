'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, Plus, Trash2, KeyRound } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from '@/features/api-keys/actions';
import type { ApiKey } from '@/features/api-keys/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface NewKeyDialogProps {
  plaintext: string;
  onClose: () => void;
}

function NewKeyDialog({ plaintext, onClose }: NewKeyDialogProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plaintext);
      toast.success('API key copied to clipboard');
    } catch {
      toast.error('Failed to copy — please copy it manually');
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your new API key</DialogTitle>
          <DialogDescription className="text-destructive font-medium">
            This key will not be shown again. Copy it now and store it safely.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md border border-border bg-input/50 px-3 py-2 font-mono text-sm break-all">
          <span className="flex-1 select-all">{plaintext}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <Copy />
            <span className="sr-only">Copy</span>
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RevokeConfirmDialogProps {
  keyLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function RevokeConfirmDialog({
  keyLabel,
  onConfirm,
  onCancel,
}: RevokeConfirmDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Revoke API key?</DialogTitle>
          <DialogDescription>
            Revoking{' '}
            <span className="font-semibold text-foreground">{keyLabel}</span>{' '}
            will immediately invalidate it. Any integrations using this key will
            stop working. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Revoke key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ApiKeysCard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [isPending, startTransition] = useTransition();
  const [newPlaintext, setNewPlaintext] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  // ---- Load keys on mount ----
  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    const result = await listApiKeys();
    if (result.success) {
      setKeys(result.data);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  // ---- Create ----
  function handleCreate() {
    if (!label.trim()) {
      toast.error('Please enter a label for your API key');
      return;
    }

    startTransition(async () => {
      const result = await createApiKey(label.trim());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLabel('');
      setNewPlaintext(result.data.plaintext);
      // Optimistically prepend the new key (without plaintext) to the list
      setKeys((prev) => [result.data.apiKey, ...prev]);
      toast.success('API key created');
    });
  }

  // ---- Revoke ----
  function handleRevokeConfirm() {
    if (!revokeTarget) return;
    const targetId = revokeTarget.id;
    setRevokeTarget(null);

    startTransition(async () => {
      const result = await revokeApiKey(targetId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      // Optimistically update the key in local state
      const now = new Date().toISOString();
      setKeys((prev) =>
        prev.map((k) =>
          k.id === targetId ? { ...k, revoked_at: now } : k,
        ),
      );
      toast.success('API key revoked');
    });
  }

  // ---- Render ----
  const activeCount = keys.filter((k) => !k.revoked_at).length;

  return (
    <>
      {/* One-time plaintext reveal dialog */}
      {newPlaintext && (
        <NewKeyDialog
          plaintext={newPlaintext}
          onClose={() => setNewPlaintext(null)}
        />
      )}

      {/* Revoke confirmation dialog */}
      {revokeTarget && (
        <RevokeConfirmDialog
          keyLabel={revokeTarget.label}
          onConfirm={handleRevokeConfirm}
          onCancel={() => setRevokeTarget(null)}
        />
      )}

      <Card className="w-full max-w-2xl bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <KeyRound className="size-5" />
            API Keys
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage personal API keys for MCP and programmatic access. Keys are
            shown only once at creation time.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Create new key form */}
          <div className="space-y-3">
            <Label htmlFor="api-key-label" className="text-foreground">
              New API key label
            </Label>
            <div className="flex gap-2">
              <Input
                id="api-key-label"
                placeholder="e.g. Claude Code — laptop"
                className="font-mono bg-input/50"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                disabled={isPending || activeCount >= 10}
                maxLength={100}
              />
              <Button
                onClick={handleCreate}
                disabled={isPending || !label.trim() || activeCount >= 10}
              >
                <Plus />
                Create
              </Button>
            </div>
            {activeCount >= 10 && (
              <p className="text-xs text-destructive">
                You have reached the limit of 10 active API keys. Revoke one to
                create a new key.
              </p>
            )}
          </div>

          {/* Key list */}
          <div className="space-y-2">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading keys…</p>
            )}

            {!isLoading && keys.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No API keys yet. Create one above.
              </p>
            )}

            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-border bg-input/20 px-4 py-3 gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-foreground truncate">
                      {key.label}
                    </span>
                    {key.revoked_at ? (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                        revoked
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                        active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {formatDate(key.created_at)}
                    {key.revoked_at &&
                      ` · Revoked ${formatDate(key.revoked_at)}`}
                  </p>
                </div>

                {!key.revoked_at && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setRevokeTarget(key)}
                    disabled={isPending}
                    title="Revoke this key"
                  >
                    <Trash2 />
                    <span className="sr-only">Revoke {key.label}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
