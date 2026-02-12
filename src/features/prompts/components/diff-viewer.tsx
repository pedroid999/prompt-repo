'use client';

import { useMemo } from 'react';
import { calculateDiff, DiffLine } from '../utils/diff';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  oldVersion?: number;
  newVersion?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiffViewer({ 
  oldValue, 
  newValue, 
  oldVersion, 
  newVersion, 
  open, 
  onOpenChange 
}: DiffViewerProps) {
  const diff = useMemo(() => calculateDiff(oldValue, newValue), [oldValue, newValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 border-border bg-sidebar overflow-hidden">
        <DialogHeader className="p-4 md:p-6 border-b border-sidebar-border shrink-0">
          <DialogTitle className="text-lg md:text-xl font-bold text-foreground">
            Version Comparison
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-muted-foreground">
            Comparing v{oldVersion} → v{newVersion}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-background">
          <ScrollArea className="h-full">
            <div className="font-mono text-[11px] md:text-xs leading-relaxed p-0 min-w-full">
              {diff.map((line, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex min-w-full whitespace-pre group",
                    line.type === 'added' && "bg-green-500/10 text-green-500",
                    line.type === 'removed' && "bg-red-500/10 text-red-500",
                    line.type === 'unchanged' && "text-muted-foreground/80 hover:bg-muted/30"
                  )}
                >
                  {/* Line Numbers & Gutter */}
                  <div className="flex-none flex select-none border-r border-border/30 bg-muted/20">
                    <div className="w-8 md:w-10 text-center py-0.5 text-[10px] text-muted-foreground/50 border-r border-border/10">
                      {line.oldLineNumber || ''}
                    </div>
                    <div className="w-8 md:w-10 text-center py-0.5 text-[10px] text-muted-foreground/50 border-r border-border/10">
                      {line.newLineNumber || ''}
                    </div>
                    <div className={cn(
                      "w-6 md:w-8 text-center py-0.5 font-bold",
                      line.type === 'added' && "text-green-500",
                      line.type === 'removed' && "text-red-500",
                    )}>
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-3 py-0.5 break-all md:break-words">
                    {line.content || ' '}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0 flex justify-between items-center text-[10px] md:text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500/50" /> Deletions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500/50" /> Additions
            </span>
          </div>
          <span>Press Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
