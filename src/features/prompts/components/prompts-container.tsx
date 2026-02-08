'use client';

import { useState, useEffect } from 'react';
import { PromptWithLatestVersion } from '../types';
import { PromptList } from './prompt-list';
import { PromptDetail } from './prompt-detail';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
}

interface PromptsContainerProps {
  prompts: PromptWithLatestVersion[];
  collections?: Collection[];
  initialSelectedId?: string;
}

export function PromptsContainer({ prompts, collections = [], initialSelectedId }: PromptsContainerProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithLatestVersion | null>(() => {
    if (initialSelectedId) {
      const found = prompts.find(p => p.id === initialSelectedId);
      if (found) return found;
    }
    return prompts.length > 0 ? prompts[0] : null
  });

  // Sync selectedPrompt with updated prompts data (e.g. after restore)
  useEffect(() => {
    if (selectedPrompt) {
      const updated = prompts.find(p => p.id === selectedPrompt.id);
      if (updated) {
        setSelectedPrompt(updated);
      }
    }
  }, [prompts]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row overflow-hidden">
      <aside className={cn(
        "w-full md:w-80 border-b md:border-b-0 md:border-r border-sidebar-border shrink-0 bg-sidebar",
        selectedPrompt && "hidden md:block"
      )}>
        <PromptList
          prompts={prompts}
          collections={collections}
          selectedId={selectedPrompt?.id}
          onSelect={setSelectedPrompt}
          className="h-full"
        />
      </aside>
      <main className={cn(
        "flex-1 relative bg-sidebar",
        !selectedPrompt && "hidden md:block"
      )}>
        {selectedPrompt && (
          <button
            onClick={() => setSelectedPrompt(null)}
            className="absolute top-4 left-4 z-20 md:hidden bg-secondary text-secondary-foreground h-10 w-10 flex items-center justify-center rounded-full shadow-lg hover:bg-secondary/80 transition-colors"
            aria-label="Back to library"
          >
            ←
          </button>
        )}
        <PromptDetail prompt={selectedPrompt} className="h-full" />
      </main>
    </div>
  );
}
