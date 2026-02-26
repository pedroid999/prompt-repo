'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PromptWithLatestVersion, PromptVersion } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PromptHistory } from './prompt-history';
import { getPromptHistory } from '../queries/get-prompt-history';
import { restoreVersion } from '../actions/restore-version';
import { saveNewVersion } from '../actions/save-new-version';
import { updatePromptMetadata } from '../actions/manage-prompt';
import { toast } from 'sonner';
import { ResolutionForm } from '@/features/resolution-engine/components/resolution-form';
import { extractVariables } from '@/lib/utils/variable-parser';
import { SnapshotList } from '@/features/snapshots/components/snapshot-list';
import { PromptSnapshot } from '@/features/snapshots/types';
import { Pencil, X, Save, Check } from 'lucide-react';

interface PromptDetailProps {
  prompt: PromptWithLatestVersion | null;
  className?: string;
}

export function PromptDetail({ prompt, className }: PromptDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'resolve' | 'snapshots'>('current');
  const [snapshotRefreshKey, setSnapshotRefreshKey] = useState(0);
  const [selectedSnapshot, setSelectedSnapshot] = useState<{ values: Record<string, string>, timestamp: number } | undefined>(undefined);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editVersionNote, setEditVersionNote] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

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
    setActiveTab('current');
    setHistory([]);
    setHistoryError(null);
    setSelectedSnapshot(undefined);
    setIsEditing(false);
    setIsEditingMetadata(false);
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
        .catch(() => {
          if (isMounted) setHistoryError("Failed to load history.");
        })
        .finally(() => {
          if (isMounted) setLoadingHistory(false);
        });
    }

    return () => { isMounted = false; };
  }, [activeTab, prompt?.id]);

  const handleRestore = async (versionId: string) => {
    if (!prompt) return;

    startTransition(async () => {
      const result = await restoreVersion(prompt.id, versionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Restored version ${result.newVersion}`);
        getPromptHistory(prompt.id).then(setHistory);
        router.refresh();
      }
    });
  };

  const handleStartEdit = () => {
    if (!prompt) return;
    setEditContent(prompt.latest_content);
    setEditVersionNote('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
    setEditVersionNote('');
  };

  const handleSaveNewVersion = async () => {
    if (!prompt) return;
    if (!editContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setIsSavingVersion(true);
    try {
      const result = await saveNewVersion(prompt.id, {
        content: editContent,
        version_note: editVersionNote || undefined,
      });

      if (result.success) {
        toast.success(`Saved as version ${result.newVersion}`);
        setIsEditing(false);
        setEditContent('');
        setEditVersionNote('');
        router.refresh();
      } else {
        toast.error('Failed to save version', { description: result.error });
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleStartMetadataEdit = () => {
    if (!prompt) return;
    setEditTitle(prompt.title);
    setEditDescription(prompt.description ?? '');
    setIsEditingMetadata(true);
  };

  const handleCancelMetadataEdit = () => {
    setIsEditingMetadata(false);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveMetadata = async () => {
    if (!prompt) return;

    setIsSavingMetadata(true);
    try {
      const result = await updatePromptMetadata(prompt.id, {
        title: editTitle,
        description: editDescription,
      });

      if (result.success) {
        toast.success('Prompt details updated');
        setIsEditingMetadata(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to update prompt details');
    } finally {
      setIsSavingMetadata(false);
    }
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
        <div className="md:hidden h-10 w-10 shrink-0" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isEditingMetadata ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Prompt title"
                  className="h-8 md:h-9 text-sm bg-background border-border"
                  autoFocus
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="min-h-[64px] text-xs md:text-sm bg-background border-border resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveMetadata}
                    disabled={isSavingMetadata || !editTitle.trim()}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <Check className="h-3 w-3" />
                    {isSavingMetadata ? 'Saving...' : 'Save Details'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelMetadataEdit}
                    disabled={isSavingMetadata}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">{prompt.title}</h1>
                  {prompt.archived_at && (
                    <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                      Archived
                    </span>
                  )}
                </div>
                {prompt.description && (
                  <p className="mt-1 md:mt-2 text-xs md:text-base text-muted-foreground line-clamp-2">{prompt.description}</p>
                )}
              </>
            )}
          </div>
          {!isEditingMetadata && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartMetadataEdit}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Edit Details
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('current'); if (isEditing) handleCancelEdit(); }}
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
          isEditing ? (
            /* ── Edit mode ── */
            <div className="flex flex-col h-full p-4 md:p-6 gap-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Editing — new version will be created
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleCancelEdit}
                  title="Cancel edit"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 resize-none font-mono text-sm bg-background border-border text-foreground min-h-[200px]"
                placeholder="Prompt content..."
                autoFocus
              />

              <div className="flex items-center gap-2 shrink-0">
                <Input
                  value={editVersionNote}
                  onChange={(e) => setEditVersionNote(e.target.value)}
                  placeholder="Version note (optional)"
                  className="flex-1 h-8 text-xs bg-background border-border text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSaveNewVersion();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSaveNewVersion}
                  disabled={isSavingVersion || !editContent.trim()}
                  className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  {isSavingVersion ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Version
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* ── Read mode ── */
            <div className="relative h-full group">
              <ScrollArea className="h-full p-4 md:p-6">
                <div className="rounded-md border border-border bg-card p-3 md:p-4 font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap shadow-sm">
                  {prompt.latest_content}
                </div>
              </ScrollArea>
              {/* Edit button — appears on hover */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStartEdit}
                className="absolute top-4 right-4 md:top-6 md:right-6 h-7 gap-1.5 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-secondary text-secondary-foreground hover:bg-secondary/80"
                title="Edit prompt content"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </div>
          )
        ) : activeTab === 'resolve' ? (
          <ScrollArea className="h-full">
            <ResolutionForm
              content={prompt.latest_content}
              promptVersionId={prompt.latest_version_id}
              onSnapshotSaved={handleSnapshotSaved}
              initialValues={selectedSnapshot?.values}
              hydrationId={selectedSnapshot?.timestamp}
              onValuesChange={(_values) => {}}
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
