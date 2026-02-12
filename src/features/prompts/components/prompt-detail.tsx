'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { PromptWithLatestVersion, PromptVersion } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PromptHistory } from './prompt-history';
import { getPromptHistory } from '../queries/get-prompt-history';
import { restoreVersion } from '../actions/restore-version';
import { toast } from 'sonner';
import { ResolutionForm } from '@/features/resolution-engine/components/resolution-form';
import { extractVariables } from '@/lib/utils/variable-parser';
import { SnapshotList } from '@/features/snapshots/components/snapshot-list';
import { PromptSnapshot } from '@/features/snapshots/types';

interface PromptDetailProps {
  prompt: PromptWithLatestVersion | null;
  className?: string;
}

export function PromptDetail({ prompt, className }: PromptDetailProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'resolve' | 'snapshots'>('current');
  const [snapshotRefreshKey, setSnapshotRefreshKey] = useState(0);
  const [selectedSnapshot, setSelectedSnapshot] = useState<{ values: Record<string, string>, timestamp: number } | undefined>(undefined);

  const handleSnapshotSaved = () => {
    setSnapshotRefreshKey(prev => prev + 1);
  };

  const handleSnapshotSelect = (snapshot: PromptSnapshot) => {
    setSelectedSnapshot({ values: snapshot.variables, timestamp: Date.now() });
    setActiveTab('resolve');
  };
  const [history, setHistory] = useState<PromptVersion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const variables = useMemo(() => 
    prompt ? extractVariables(prompt.latest_content) : [],
    [prompt]
  );
  const hasVariables = variables.length > 0;

  useEffect(() => {
    // Reset tab when prompt changes, or keep it?
    // UX: usually keep current tab if just switching prompts? 
    // But history is specific to prompt.
    // Let's reset to current for safety/simplicity.
    setActiveTab('current');
    setHistory([]);
    setHistoryError(null);
    setSelectedSnapshot(undefined);
  }, [prompt?.id]);

  useEffect(() => {
    let isMounted = true;

    if (activeTab === 'history' && prompt?.id) {
      setLoadingHistory(true);
      setHistoryError(null);
      getPromptHistory(prompt.id)
        .then((data) => {
          if (isMounted) setHistory(data);
        })
        .catch((_err) => {
          if (isMounted) setHistoryError("Failed to load history.");
        })
        .finally(() => {
          if (isMounted) setLoadingHistory(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab, prompt?.id]);

  const handleRestore = async (versionId: string) => {
    if (!prompt) return;
    
    startTransition(async () => {
      const result = await restoreVersion(prompt.id, versionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Restored version ${result.newVersion}`);
        // Refresh history to show new version
        getPromptHistory(prompt.id).then(setHistory);
      }
    });
  };

  if (!prompt) {
    return (
      <div className={cn('flex h-full items-center justify-center bg-sidebar text-muted-foreground', className)}>
        Select a prompt to view details
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col bg-sidebar', className)}>
      <header className="border-b border-sidebar-border p-4 md:p-6 pb-0 relative">
        <div className="md:hidden h-10 w-10 shrink-0" /> {/* Spacer for Back button */}
        <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">{prompt.title}</h1>
        {prompt.description && (
          <p className="mt-1 md:mt-2 text-xs md:text-base text-muted-foreground line-clamp-2">{prompt.description}</p>
        )}
        
        <div className="flex gap-4 md:gap-6 mt-4 md:mt-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('current')}
            className={cn(
              "pb-2 md:pb-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === 'current' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Current
          </button>
          {hasVariables && (
            <button
              onClick={() => setActiveTab('resolve')}
              className={cn(
                "pb-2 md:pb-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === 'resolve' 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Resolve
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "pb-2 md:pb-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === 'history' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={cn(
              "pb-2 md:pb-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === 'snapshots' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Snapshots
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'current' ? (
          <ScrollArea className="h-full p-4 md:p-6">
            <div className="rounded-md border border-border bg-card p-3 md:p-4 font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap shadow-sm">
              {prompt.latest_content}
            </div>
          </ScrollArea>
        ) : activeTab === 'resolve' ? (
          <ScrollArea className="h-full">
            <ResolutionForm 
              content={prompt.latest_content} 
              promptVersionId={prompt.latest_version_id}
              onSnapshotSaved={handleSnapshotSaved}
              initialValues={selectedSnapshot?.values}
              hydrationId={selectedSnapshot?.timestamp}
              onValuesChange={(_values) => {
                // Future: real-time preview in Story 3.3
              }}
            />
            <div className="border-t border-border mt-4">
              <h4 className="p-4 pb-0 text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Saved Snapshots</h4>
              <SnapshotList 
                key={`resolve-${snapshotRefreshKey}`}
                promptVersionId={prompt.latest_version_id} 
                promptContent={prompt.latest_content}
                onSelect={handleSnapshotSelect}
              />
            </div>
          </ScrollArea>
        ) : activeTab === 'snapshots' ? (
          <div className="h-full">
             <SnapshotList 
                key={`tab-${snapshotRefreshKey}`}
                promptVersionId={prompt.latest_version_id} 
                promptContent={prompt.latest_content}
                onSelect={handleSnapshotSelect}
              />
          </div>
        ) : (
          <div className="h-full">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading history...
              </div>
            ) : historyError ? (
              <div className="flex items-center justify-center h-full text-destructive">
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No history available.
              </div>
            ) : (
              <PromptHistory 
                versions={history} 
                onRestore={handleRestore} 
                className="bg-transparent border-l-0"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}