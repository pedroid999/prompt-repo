'use client';

// ---------------------------------------------------------------------------
// ComposerToolbar — mode toggle, provider/model selectors, AI trigger button
// ---------------------------------------------------------------------------

import { Loader2, Sparkles, BrainCircuit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComposerMode } from '@/features/ai-composer/types';
import type { ProviderName } from '@/features/ai-providers/types';

// ---------------------------------------------------------------------------
// Provider display metadata
// ---------------------------------------------------------------------------

const PROVIDER_LABELS: Record<ProviderName, string> = {
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  ollama: 'Ollama',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ComposerToolbarProps {
  /** Current editor mode. */
  mode: ComposerMode;
  /** Callback when the user toggles between brainstorm and structured. */
  onModeChange: (mode: ComposerMode) => void;
  /** List of active (enabled) providers for the current user. */
  availableProviders: ProviderName[];
  /** Currently selected provider. */
  selectedProvider: ProviderName | null;
  /** Callback when the user selects a provider. */
  onProviderChange: (provider: ProviderName) => void;
  /** Available models for the selected provider (Ollama dynamic list). */
  availableModels: string[];
  /** Currently selected model override (optional). */
  selectedModel: string;
  /** Callback when the user selects a model. */
  onModelChange: (model: string) => void;
  /** Whether AI structuring is in progress. */
  isStructuring: boolean;
  /** Callback to trigger AI structuring. */
  onStructure: () => void;
  /** Whether the brainstorm content is empty (disables Structure button). */
  hasBrainstormContent: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComposerToolbar({
  mode,
  onModeChange,
  availableProviders,
  selectedProvider,
  onProviderChange,
  availableModels,
  selectedModel,
  onModelChange,
  isStructuring,
  onStructure,
  hasBrainstormContent,
}: ComposerToolbarProps) {
  const hasProviders = availableProviders.length > 0;
  const canStructure = hasProviders && hasBrainstormContent && !isStructuring && mode === 'brainstorm';

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Mode toggle + Structure button */}
      <div className="flex items-center justify-between gap-2">
        {/* Mode toggle */}
        <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => onModeChange('brainstorm')}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
              mode === 'brainstorm'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BrainCircuit className="size-3.5" />
            <span className="hidden sm:inline">Brainstorm</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('structured')}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
              mode === 'structured'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">Structured</span>
          </button>
        </div>

        {/* Structure with AI button */}
        <Button
          type="button"
          size="sm"
          onClick={onStructure}
          disabled={!canStructure}
          title={
            !hasProviders
              ? 'Configure an AI provider in your profile settings first'
              : !hasBrainstormContent
                ? 'Write some brainstorm notes first'
                : mode !== 'brainstorm'
                  ? 'Switch to brainstorm mode to use AI structuring'
                  : 'Structure your brainstorm notes with AI'
          }
          className="gap-1.5"
        >
          {isStructuring ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          <span className="text-xs">
            {isStructuring ? 'Structuring...' : 'Structure with AI'}
          </span>
        </Button>
      </div>

      {/* Row 2: Provider + Model selectors (only visible in brainstorm mode) */}
      {mode === 'brainstorm' && (
        <div className="flex items-center gap-2">
          {/* Provider selector */}
          <div className="flex-1 min-w-0">
            <select
              value={selectedProvider ?? ''}
              onChange={(e) => onProviderChange(e.target.value as ProviderName)}
              disabled={!hasProviders || isStructuring}
              className={cn(
                'w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs',
                'text-foreground outline-none transition-colors',
                'focus:border-ring focus:ring-ring/50 focus:ring-[3px]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {!hasProviders && (
                <option value="">No providers configured</option>
              )}
              {availableProviders.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {/* Model selector (shows dynamic list for Ollama, default for cloud) */}
          {selectedProvider && availableModels.length > 0 && (
            <div className="flex-1 min-w-0">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={isStructuring}
                className={cn(
                  'w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs',
                  'text-foreground outline-none transition-colors',
                  'focus:border-ring focus:ring-ring/50 focus:ring-[3px]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
