'use client';

// ---------------------------------------------------------------------------
// ComposerEditor — mode-aware textarea wrapper for the dual-mode editor
// ---------------------------------------------------------------------------

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ComposerMode } from '@/features/ai-composer/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ComposerEditorProps {
  /** Current editor mode. */
  mode: ComposerMode;
  /** Content for brainstorm mode. */
  brainstormContent: string;
  /** Callback when brainstorm content changes. */
  onBrainstormChange: (value: string) => void;
  /** Content for structured mode. */
  structuredContent: string;
  /** Callback when structured content changes. */
  onStructuredChange: (value: string) => void;
  /** Whether AI structuring is in progress (shows loading state). */
  isStructuring?: boolean;
  /** Additional className for the textarea. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Placeholder text per mode
// ---------------------------------------------------------------------------

const BRAINSTORM_PLACEHOLDER = `Write your ideas, notes, rough prompt...

Examples:
- "I need a prompt that helps me write blog posts about tech topics"
- "System prompt for a code reviewer that checks for security issues"
- "Template for generating product descriptions with {{product_name}} and {{tone}}"

Tip: When ready, click "Structure with AI" to transform your notes into a well-formatted prompt.`;

const STRUCTURED_PLACEHOLDER = `Write your structured prompt content here...

Supports markdown formatting and {{variable}} placeholders.`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComposerEditor({
  mode,
  brainstormContent,
  onBrainstormChange,
  structuredContent,
  onStructuredChange,
  isStructuring = false,
  className,
}: ComposerEditorProps) {
  const isBrainstorm = mode === 'brainstorm';
  const currentContent = isBrainstorm ? brainstormContent : structuredContent;
  const currentOnChange = isBrainstorm ? onBrainstormChange : onStructuredChange;
  const placeholder = isBrainstorm ? BRAINSTORM_PLACEHOLDER : STRUCTURED_PLACEHOLDER;

  return (
    <div className="relative">
      <Textarea
        value={currentContent}
        onChange={(e) => currentOnChange(e.target.value)}
        placeholder={placeholder}
        disabled={isStructuring}
        className={cn(
          'min-h-[150px] md:min-h-[200px] text-sm transition-colors',
          isBrainstorm
            ? 'font-sans leading-relaxed'
            : 'font-mono',
          isStructuring && 'opacity-50',
          className,
        )}
      />
      {isStructuring && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>AI is structuring your prompt...</span>
          </div>
        </div>
      )}
    </div>
  );
}
