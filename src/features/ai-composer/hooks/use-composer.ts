'use client';

// ---------------------------------------------------------------------------
// useComposer — orchestrator hook for the AI composer feature
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { ComposerMode, AiStructureResult } from '@/features/ai-composer/types';
import type { ProviderName } from '@/features/ai-providers/types';
import type { UserAiProviderDisplay } from '@/features/ai-providers/types';
import { getProviderDisplayList } from '@/features/ai-providers/queries';
import { structurePrompt, listOllamaModels } from '@/features/ai-composer/actions';

// ---------------------------------------------------------------------------
// Default cloud-provider model names (for display only; server picks default)
// ---------------------------------------------------------------------------

const DEFAULT_CLOUD_MODELS: Record<string, string[]> = {
  claude: ['Default (Claude Sonnet 4.6)'],
  openai: ['Default (GPT-5-Mini)'],
  gemini: ['Default (Gemini Pro)'],
};

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseComposerReturn {
  // Editor state
  mode: ComposerMode;
  brainstormContent: string;
  structuredContent: string;
  isStructuring: boolean;

  // Provider state
  availableProviders: ProviderName[];
  selectedProvider: ProviderName | null;
  availableModels: string[];
  selectedModel: string;
  isLoadingProviders: boolean;

  // Diff dialog state
  isDiffOpen: boolean;
  pendingResult: AiStructureResult | null;

  // Actions
  setMode: (mode: ComposerMode) => void;
  setBrainstormContent: (content: string) => void;
  setStructuredContent: (content: string) => void;
  setSelectedProvider: (provider: ProviderName) => void;
  setSelectedModel: (model: string) => void;
  triggerStructure: () => void;
  acceptResult: (content: string) => void;
  rejectResult: () => void;
  setDiffOpen: (open: boolean) => void;
  refreshProviders: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface UseComposerOptions {
  /** Initial content to populate the structured editor with. */
  initialContent?: string;
  /** Callback when structured content is accepted (from AI or edited). */
  onContentChange?: (content: string) => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useComposer(options: UseComposerOptions = {}): UseComposerReturn {
  const { initialContent = '', onContentChange } = options;

  // ---- Editor state -------------------------------------------------------
  const [mode, setMode] = useState<ComposerMode>('brainstorm');
  const [brainstormContent, setBrainstormContent] = useState('');
  const [structuredContent, setStructuredContentInternal] = useState(initialContent);
  const [isStructuring, setIsStructuring] = useState(false);

  // ---- Provider state -----------------------------------------------------
  const [providers, setProviders] = useState<UserAiProviderDisplay[]>([]);
  const [selectedProvider, setSelectedProviderState] = useState<ProviderName | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  // ---- Diff dialog state --------------------------------------------------
  const [isDiffOpen, setDiffOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<AiStructureResult | null>(null);

  // ---- Derived values -----------------------------------------------------
  const availableProviders: ProviderName[] = providers
    .filter((p) => p.is_active)
    .map((p) => p.provider);

  // ---- Structured content setter with callback ----------------------------
  const setStructuredContent = useCallback(
    (content: string) => {
      setStructuredContentInternal(content);
      onContentChange?.(content);
    },
    [onContentChange],
  );

  // ---- Load providers on mount --------------------------------------------
  const refreshProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    try {
      const result = await getProviderDisplayList();
      if (result.success) {
        setProviders(result.data);
        // Auto-select the first active provider if none selected
        const active = result.data.filter((p) => p.is_active);
        if (active.length > 0 && !selectedProvider) {
          setSelectedProviderState(active[0].provider);
        }
      }
    } catch {
      // silently fail — providers just won't be available
    } finally {
      setIsLoadingProviders(false);
    }
  }, [selectedProvider]);

  useEffect(() => {
    refreshProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Load models when provider changes ----------------------------------
  const setSelectedProvider = useCallback(
    (provider: ProviderName) => {
      setSelectedProviderState(provider);
      setSelectedModel('');
      setAvailableModels([]);
    },
    [],
  );

  useEffect(() => {
    if (!selectedProvider) {
      setAvailableModels([]);
      return;
    }

    if (selectedProvider === 'ollama') {
      // For Ollama, find the endpoint and fetch models dynamically
      const ollamaConfig = providers.find(
        (p) => p.provider === 'ollama' && p.is_active,
      );
      const endpoint = ollamaConfig?.endpoint_url;

      if (endpoint) {
        let cancelled = false;
        listOllamaModels(endpoint).then((result) => {
          if (cancelled) return;
          if (result.success && result.data.length > 0) {
            setAvailableModels(result.data);
            setSelectedModel(result.data[0]);
          } else {
            setAvailableModels(['No models found']);
          }
        });
        return () => {
          cancelled = true;
        };
      } else {
        setAvailableModels([]);
      }
    } else {
      // Cloud providers: show a single "default" entry
      const models = DEFAULT_CLOUD_MODELS[selectedProvider] ?? [];
      setAvailableModels(models);
      if (models.length > 0) {
        setSelectedModel(models[0]);
      }
    }
  }, [selectedProvider, providers]);

  // ---- Trigger AI structuring ---------------------------------------------
  const triggerStructure = useCallback(async () => {
    if (!selectedProvider || !brainstormContent.trim()) return;

    setIsStructuring(true);
    try {
      // For cloud providers, don't send the "Default (...)" display label
      const modelOverride =
        selectedProvider === 'ollama' ? selectedModel : undefined;

      const result = await structurePrompt({
        brainstormText: brainstormContent,
        provider: selectedProvider,
        model: modelOverride || undefined,
      });

      if (result.success) {
        setPendingResult(result.data);
        setDiffOpen(true);
      } else {
        toast.error('Structuring failed', {
          description: result.error,
        });
      }
    } catch {
      toast.error('An unexpected error occurred while structuring');
    } finally {
      setIsStructuring(false);
    }
  }, [selectedProvider, brainstormContent, selectedModel]);

  // ---- Accept / Reject result ---------------------------------------------
  const acceptResult = useCallback(
    (content: string) => {
      setStructuredContent(content);
      setMode('structured');
      setPendingResult(null);
      toast.success('Structured content applied', {
        description: 'Switch to "Brainstorm" mode to refine and re-structure.',
        style: {
          borderColor: 'var(--success)',
          color: 'var(--success)',
        },
      });
    },
    [setStructuredContent],
  );

  const rejectResult = useCallback(() => {
    setPendingResult(null);
    toast.info('Structured result discarded');
  }, []);

  // ---- Return -------------------------------------------------------------
  return {
    // Editor state
    mode,
    brainstormContent,
    structuredContent,
    isStructuring,

    // Provider state
    availableProviders,
    selectedProvider,
    availableModels,
    selectedModel,
    isLoadingProviders,

    // Diff dialog state
    isDiffOpen,
    pendingResult,

    // Actions
    setMode,
    setBrainstormContent,
    setStructuredContent,
    setSelectedProvider,
    setSelectedModel,
    triggerStructure,
    acceptResult,
    rejectResult,
    setDiffOpen,
    refreshProviders,
  };
}
