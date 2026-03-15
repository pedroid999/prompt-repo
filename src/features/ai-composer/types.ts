// ---------------------------------------------------------------------------
// AI Composer domain types
// ---------------------------------------------------------------------------

import type { ProviderName } from '@/features/ai-providers/types';

/** The two modes of the dual-mode prompt editor. */
export type ComposerMode = 'brainstorm' | 'structured';

// ---------------------------------------------------------------------------
// Structuring request/response
// ---------------------------------------------------------------------------

/** Input for the AI structuring Server Action. */
export interface AiStructureRequest {
  /** The freeform brainstorm text to be structured. */
  brainstormText: string;
  /** Which provider to use for the structuring call. */
  provider: ProviderName;
  /** Optional model override (provider-specific). */
  model?: string;
}

/** Result returned from a successful AI structuring call. */
export interface AiStructureResult {
  /** The LLM-generated structured markdown content. */
  structuredContent: string;
  /** The model that was actually used (e.g. "claude-sonnet-4-20250514"). */
  model: string;
  /** Token usage, if reported by the provider. */
  tokensUsed?: {
    input: number;
    output: number;
  };
}

// ---------------------------------------------------------------------------
// Provider adapter interface
// ---------------------------------------------------------------------------

/**
 * Contract for AI provider adapters. Each provider (Claude, OpenAI, Gemini,
 * Ollama) implements this interface with its own API-specific logic.
 */
export interface AiProvider {
  readonly name: ProviderName;
  /**
   * Send brainstorm text to the LLM and receive structured markdown back.
   * The systemPrompt instructs the LLM how to structure the output.
   */
  structure(
    brainstormText: string,
    systemPrompt: string,
  ): Promise<AiStructureResult>;
}

/**
 * Configuration passed to a provider adapter factory.
 * Contains the decrypted credentials needed to make API calls.
 */
export interface ProviderAdapterConfig {
  provider: ProviderName;
  /** Decrypted API key (cloud providers). */
  apiKey?: string;
  /** Endpoint URL (Ollama). */
  endpoint?: string;
  /** Optional model override. */
  model?: string;
}

// ---------------------------------------------------------------------------
// Composer editor state
// ---------------------------------------------------------------------------

/** State shape for the dual-mode composer editor (client-side). */
export interface ComposerEditorState {
  mode: ComposerMode;
  /** Freeform brainstorm notes (persisted independently of structured content). */
  brainstormContent: string;
  /** The structured prompt content (same as the existing content field). */
  structuredContent: string;
  /** Whether an AI structuring request is in flight. */
  isStructuring: boolean;
  /** The last structuring result preview (before user accepts/rejects). */
  pendingResult: AiStructureResult | null;
}
