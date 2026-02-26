'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { PromptWithLatestVersion } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { addToCollection, removeFromCollection } from '@/features/collections/actions';
import { archivePrompt, deletePrompt, restorePrompt } from '@/features/prompts/actions/manage-prompt';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
}

interface PromptListProps {
  prompts: PromptWithLatestVersion[];
  collections?: Collection[];
  view?: 'active' | 'archived';
  selectedId?: string;
  onSelect: (prompt: PromptWithLatestVersion) => void;
  className?: string;
}

function getRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function PromptList({
  prompts,
  collections = [],
  view = 'active',
  selectedId,
  onSelect,
  className,
}: PromptListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggleCollection = async (promptId: string, collectionId: string, isAdded: boolean) => {
    const result = isAdded
      ? await removeFromCollection(promptId, collectionId)
      : await addToCollection(promptId, collectionId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isAdded ? "Removed from collection" : "Added to collection");
      router.refresh();
    }
  };

  const handleArchive = async (promptId: string) => {
    startTransition(async () => {
      const result = await archivePrompt(promptId);
      if (result.success) {
        toast.success('Prompt archived');
        router.refresh();
        return;
      }
      toast.error(result.error);
    });
  };

  const handleRestore = async (promptId: string) => {
    startTransition(async () => {
      const result = await restorePrompt(promptId);
      if (result.success) {
        toast.success('Prompt restored');
        router.refresh();
        return;
      }
      toast.error(result.error);
    });
  };

  const handleDelete = async (promptId: string) => {
    if (!window.confirm('Delete this prompt permanently? This removes all versions and snapshots.')) {
      return;
    }

    startTransition(async () => {
      const result = await deletePrompt(promptId);
      if (result.success) {
        toast.success('Prompt deleted permanently');
        router.refresh();
        return;
      }
      toast.error(result.error);
    });
  };

  return (
    <div className={cn('flex flex-col h-full bg-[#16161D]', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D4F67]/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#727169]">
            {view === 'archived' ? 'Archived' : 'Library'}
          </span>
          {isPending && <span className="text-[10px] text-[#727169]">Updating…</span>}
        </div>
        {prompts.length > 0 && (
          <span className="text-[10px] font-medium text-[#727169] bg-[#2D4F67]/40 px-1.5 py-0.5 rounded-full tabular-nums">
            {prompts.length}
          </span>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col py-1">
          {prompts.map((prompt) => {
            const isSelected = selectedId === prompt.id;
            const preview = prompt.description
              ? prompt.description
              : prompt.latest_content?.slice(0, 80).replace(/\n/g, ' ') ?? '';

            return (
              <ContextMenu key={prompt.id}>
                <ContextMenuTrigger>
                  <button
                    type="button"
                    onClick={() => onSelect(prompt)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 relative flex gap-3 items-start transition-colors outline-none group',
                      'border-l-2',
                      isSelected
                        ? 'bg-[#2D4F67]/60 border-l-[#7E9CD8]'
                        : 'border-l-transparent hover:bg-[#1F1F28]/80 hover:border-l-[#2D4F67]'
                    )}
                  >
                    {/* Icon */}
                    <span className={cn(
                      'mt-0.5 shrink-0 transition-colors',
                      isSelected ? 'text-[#7E9CD8]' : 'text-[#727169] group-hover:text-[#DCD7BA]'
                    )}>
                      <FileText className="h-3.5 w-3.5" />
                    </span>

                    {/* Text content */}
                    <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                      <span className={cn(
                        'text-xs font-medium leading-tight truncate',
                        isSelected ? 'text-[#DCD7BA]' : 'text-[#C8C093] group-hover:text-[#DCD7BA]'
                      )}>
                        {prompt.title}
                      </span>
                      {preview && (
                        <span className="text-[10px] text-[#727169] line-clamp-1 leading-snug">
                          {preview}
                        </span>
                      )}
                    </span>

                    {/* Date badge */}
                    <span className={cn(
                      'text-[9px] tabular-nums shrink-0 mt-0.5 transition-colors',
                      isSelected ? 'text-[#7E9CD8]/70' : 'text-[#727169]/60 group-hover:text-[#727169]'
                    )}>
                      {getRelativeDate(prompt.updated_at)}
                    </span>
                  </button>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48 bg-[#1F1F28] border-[#2D4F67] text-[#DCD7BA]">
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="focus:bg-[#2D4F67] focus:text-[#DCD7BA]">
                      Manage Collections
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48 bg-[#1F1F28] border-[#2D4F67] text-[#DCD7BA]">
                      {collections.length === 0 && (
                        <ContextMenuItem disabled>No collections</ContextMenuItem>
                      )}
                      {collections.map(col => {
                        const isAdded = prompt.collection_ids?.includes(col.id) ?? false;
                        return (
                          <ContextMenuCheckboxItem
                            key={col.id}
                            checked={isAdded}
                            onSelect={(e) => {
                              e.preventDefault();
                              handleToggleCollection(prompt.id, col.id, isAdded);
                            }}
                            className="focus:bg-[#2D4F67] focus:text-[#DCD7BA]"
                          >
                            {col.name}
                          </ContextMenuCheckboxItem>
                        );
                      })}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuSeparator className="bg-[#2D4F67]/60" />
                  {(prompt.archived_at ?? null) ? (
                    <>
                      <ContextMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleRestore(prompt.id);
                        }}
                        className="focus:bg-[#2D4F67] focus:text-[#DCD7BA]"
                      >
                        Restore Prompt
                      </ContextMenuItem>
                      <ContextMenuItem
                        variant="destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          handleDelete(prompt.id);
                        }}
                        className="focus:bg-[#2D4F67] focus:text-[#DCD7BA]"
                      >
                        Delete Permanently
                      </ContextMenuItem>
                    </>
                  ) : (
                    <ContextMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleArchive(prompt.id);
                      }}
                      className="focus:bg-[#2D4F67] focus:text-[#DCD7BA]"
                    >
                      Archive Prompt
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

          {prompts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-2 text-center">
              <FileText className="h-8 w-8 text-[#727169]/40" />
              <p className="text-xs text-[#727169]">No prompts found.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
