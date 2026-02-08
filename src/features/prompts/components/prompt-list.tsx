'use client';

import { PromptWithLatestVersion } from '../types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { addToCollection, removeFromCollection } from '@/features/collections/actions';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
}

interface PromptListProps {
  prompts: PromptWithLatestVersion[];
  collections?: Collection[];
  selectedId?: string;
  onSelect: (prompt: PromptWithLatestVersion) => void;
  className?: string;
}

export function PromptList({ prompts, collections = [], selectedId, onSelect, className }: PromptListProps) {
  
  const handleToggleCollection = async (promptId: string, collectionId: string, isAdded: boolean) => {
    let result;
    if (isAdded) {
      result = await removeFromCollection(promptId, collectionId);
    } else {
      result = await addToCollection(promptId, collectionId);
    }

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isAdded ? "Removed from collection" : "Added to collection");
    }
  };

  return (
    <ScrollArea className={cn('h-full bg-[#16161D]', className)}>
      <div className="flex flex-col gap-px p-px">
        {prompts.map((prompt) => (
          <ContextMenu key={prompt.id}>
            <ContextMenuTrigger>
              <Card
                className={cn(
                  'cursor-pointer rounded-none border-none transition-colors hover:bg-[#2D4F67]',
                  selectedId === prompt.id ? 'bg-[#2D4F67]' : 'bg-[#1F1F28]'
                )}
                onClick={() => onSelect(prompt)}
              >
                <CardHeader className="p-2 md:p-3">
                  <CardTitle className="text-sm font-medium text-[#DCD7BA] truncate">
                    {prompt.title}
                  </CardTitle>
                  {prompt.description && (
                    <CardDescription className="text-xs text-[#727169] line-clamp-1">
                      {prompt.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48 bg-[#1F1F28] border-[#2D4F67] text-[#DCD7BA]">
               <ContextMenuSub>
                 <ContextMenuSubTrigger className="focus:bg-[#2D4F67] focus:text-[#DCD7BA]">Manage Collections</ContextMenuSubTrigger>
                 <ContextMenuSubContent className="w-48 bg-[#1F1F28] border-[#2D4F67] text-[#DCD7BA]">
                   {collections.length === 0 && (
                     <ContextMenuItem disabled>No collections</ContextMenuItem>
                   )}
                   {collections.map(col => {
                     const isAdded = prompt.collection_ids?.includes(col.id) || false;
                     return (
                       <ContextMenuCheckboxItem 
                          key={col.id} 
                          checked={isAdded}
                          onSelect={(e) => {
                            e.preventDefault(); // Keep menu open? No, standard behavior is fine.
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
            </ContextMenuContent>
          </ContextMenu>
        ))}
        {prompts.length === 0 && (
          <div className="p-4 text-center text-sm text-[#727169]">
            No prompts found.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}