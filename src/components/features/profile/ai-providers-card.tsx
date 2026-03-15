'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Bot, Eye, EyeOff, Trash2, Save, RefreshCw, Loader2 } from 'lucide-react';
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
  saveProvider,
  deleteProvider,
  toggleProvider,
} from '@/features/ai-providers/actions';
import { getProviderDisplayList } from '@/features/ai-providers/queries';
import { listOllamaModels } from '@/features/ai-composer/actions';
import type { ProviderName, UserAiProviderDisplay } from '@/features/ai-providers/types';
import { PROVIDER_NAMES, CLOUD_PROVIDERS } from '@/features/ai-providers/types';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------

interface ProviderMeta {
  label: string;
  placeholder: string;
  description: string;
}

const PROVIDER_META: Record<ProviderName, ProviderMeta> = {
  claude: {
    label: 'Claude (Anthropic)',
    placeholder: 'sk-ant-...',
    description: 'Anthropic Claude API key',
  },
  openai: {
    label: 'OpenAI',
    placeholder: 'sk-...',
    description: 'OpenAI API key',
  },
  gemini: {
    label: 'Gemini (Google)',
    placeholder: 'AIza...',
    description: 'Google Gemini API key',
  },
  ollama: {
    label: 'Ollama (Local)',
    placeholder: 'http://localhost:11434',
    description: 'Self-hosted Ollama endpoint',
  },
};

// ---------------------------------------------------------------------------
// ProviderRow — individual provider config row
// ---------------------------------------------------------------------------

interface ProviderRowProps {
  provider: ProviderName;
  config: UserAiProviderDisplay | undefined;
  onSaved: () => void;
}

function ProviderRow({ provider, config, onSaved }: ProviderRowProps) {
  const meta = PROVIDER_META[provider];
  const isCloud = (CLOUD_PROVIDERS as readonly string[]).includes(provider);
  const isOllama = provider === 'ollama';

  const [isPending, startTransition] = useTransition();

  // Cloud providers: API key input
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Ollama: endpoint URL + model picker
  const [endpointUrl, setEndpointUrl] = useState(
    config?.endpoint_url ?? 'http://localhost:11434',
  );
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Sync endpoint_url from config when it changes
  useEffect(() => {
    if (config?.endpoint_url) {
      setEndpointUrl(config.endpoint_url);
    }
  }, [config?.endpoint_url]);

  // ---- Save ----
  function handleSave() {
    startTransition(async () => {
      const input = isCloud
        ? { provider, api_key: apiKey }
        : { provider, endpoint_url: endpointUrl };

      const result = await saveProvider(input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setApiKey('');
      setShowKey(false);
      toast.success(`${meta.label} saved`);
      onSaved();
    });
  }

  // ---- Delete ----
  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProvider({ provider });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${meta.label} removed`);
      onSaved();
    });
  }

  // ---- Toggle ----
  function handleToggle() {
    if (!config) return;
    startTransition(async () => {
      const result = await toggleProvider({
        provider,
        is_active: !config.is_active,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${meta.label} ${config.is_active ? 'disabled' : 'enabled'}`,
      );
      onSaved();
    });
  }

  // ---- Ollama: fetch models ----
  const handleFetchModels = useCallback(async () => {
    if (!endpointUrl.trim()) return;
    setIsLoadingModels(true);
    try {
      const result = await listOllamaModels(endpointUrl);
      if (result.success) {
        setOllamaModels(result.data);
        if (result.data.length === 0) {
          toast.info('No models found. Pull a model with `ollama pull <model>`.');
        } else {
          toast.success(`Found ${result.data.length} model(s)`);
        }
      } else {
        toast.error(result.error);
        setOllamaModels([]);
      }
    } finally {
      setIsLoadingModels(false);
    }
  }, [endpointUrl]);

  const isConfigured = !!config;

  return (
    <div className="rounded-lg border border-border bg-input/20 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm text-foreground">
            {meta.label}
          </span>
          {isConfigured ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                config.is_active
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {config.is_active ? 'active' : 'disabled'}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              not configured
            </span>
          )}
        </div>

        {isConfigured && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="xs"
              onClick={handleToggle}
              disabled={isPending}
              title={config.is_active ? 'Disable provider' : 'Enable provider'}
            >
              {config.is_active ? 'Disable' : 'Enable'}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isPending}
              title="Remove provider"
            >
              <Trash2 />
              <span className="sr-only">Remove {meta.label}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Cloud provider: API key input */}
      {isCloud && (
        <div className="space-y-2">
          {isConfigured && config.masked_key && (
            <p className="text-xs text-muted-foreground">
              Current key: <span className="font-mono">{config.masked_key}</span>
            </p>
          )}
          <Label htmlFor={`${provider}-key`} className="text-xs text-muted-foreground">
            {isConfigured ? 'Replace API key' : 'API key'}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`${provider}-key`}
                type={showKey ? 'text' : 'password'}
                placeholder={meta.placeholder}
                className="font-mono bg-input/50 pr-9 text-xs"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isPending}
                maxLength={500}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !apiKey.trim()}
            >
              <Save />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Ollama: endpoint URL + model picker */}
      {isOllama && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ollama-endpoint" className="text-xs text-muted-foreground">
              Endpoint URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="ollama-endpoint"
                type="url"
                placeholder={meta.placeholder}
                className="font-mono bg-input/50 text-xs"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                disabled={isPending}
                maxLength={500}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || !endpointUrl.trim()}
              >
                <Save />
                Save
              </Button>
            </div>
          </div>

          {/* Model discovery */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">
                Available models
              </Label>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleFetchModels}
                disabled={isLoadingModels || !endpointUrl.trim()}
                title="Refresh model list"
              >
                {isLoadingModels ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RefreshCw />
                )}
                {isLoadingModels ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            {ollamaModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ollamaModels.map((model) => (
                  <span
                    key={model}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground"
                  >
                    {model}
                  </span>
                ))}
              </div>
            )}
            {ollamaModels.length === 0 && !isLoadingModels && (
              <p className="text-xs text-muted-foreground">
                Click Refresh to discover available models.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AiProvidersCard() {
  const [providers, setProviders] = useState<UserAiProviderDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    const result = await getProviderDisplayList();
    if (result.success) {
      setProviders(result.data);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Build a lookup map for configured providers
  const configMap = new Map(
    providers.map((p) => [p.provider, p]),
  );

  return (
    <Card className="w-full max-w-2xl bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Bot className="size-5" />
          AI Providers
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure AI providers for prompt structuring. Add your API keys for
          cloud providers or connect to a local Ollama instance.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading providers...</p>
        ) : (
          PROVIDER_NAMES.map((provider) => (
            <ProviderRow
              key={provider}
              provider={provider}
              config={configMap.get(provider)}
              onSaved={loadProviders}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
