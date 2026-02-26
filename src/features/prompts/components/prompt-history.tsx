'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { History, RotateCcw, GitCompare, X } from "lucide-react"
import { PromptVersion } from "../types"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { DiffViewer } from "./diff-viewer"

interface PromptHistoryProps {
  versions: PromptVersion[];
  onRestore: (versionId: string) => void;
  className?: string;
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function PromptHistory({ versions, onRestore, className }: PromptHistoryProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection if we already have 2
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleDiff = useCallback(() => {
    if (selectedIds.length === 2) {
      setIsDiffOpen(true);
    }
  }, [selectedIds]);

  // Keyboard shortcut 'D' for diff
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd' && selectedIds.length === 2 && !isDiffOpen) {
        // Only trigger if not typing in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleDiff();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDiff, selectedIds, isDiffOpen]);

  const selectedVersions = versions
    .filter(v => selectedIds.includes(v.id))
    .sort((a, b) => a.version_number - b.version_number);

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-l border-sidebar-border relative", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">History</h3>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {selectedIds.length}/2 selected
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds([])}
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col p-3 md:p-4 gap-4 md:gap-6 relative">
            {/* Vertical Line */}
            <div className="absolute left-[23px] md:left-[27px] top-6 bottom-6 w-px bg-border z-0" />
            
            {versions.map((version, index) => {
              const isLatest = index === 0;
              const isSelected = selectedIds.includes(version.id);
              return (
                <div 
                  key={version.id} 
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSelection(version.id);
                    }
                  }}
                  className={cn(
                    "relative z-10 flex gap-3 md:gap-4 group cursor-pointer p-2 -m-2 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50 focus-visible:bg-muted/50"
                  )}
                  onClick={() => toggleSelection(version.id)}
                >
                    {/* Timeline Node */}
                    <div className="flex-none mt-1">
                      <div className={cn(
                        "h-3 w-3 rounded-full transition-colors ring-4 ring-sidebar",
                        isSelected ? "bg-primary scale-110" : (isLatest ? "bg-primary/40" : "bg-border group-hover:bg-primary/30")
                      )} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          "text-xs font-mono font-medium shrink-0",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}>v{version.version_number}</span>
                        {isLatest && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">HEAD</span>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate">{getRelativeTime(version.created_at)}</span>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestore(version.id);
                            }}
                            title="Restore this version"
                        >
                            <RotateCcw className="h-3 w-3" />
                            <span className="sr-only">Restore</span>
                        </Button>
                    </div>
                    
                    {version.version_note && (
                        <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 break-words leading-tight">{version.version_note}</p>
                    )}
                    </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>

      {/* Floating Action Bar for Diff */}
      {selectedIds.length === 2 && (
        <div className="absolute bottom-4 left-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button 
            className="w-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 text-xs"
            onClick={handleDiff}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Compare Selected (Press D)
          </Button>
        </div>
      )}

      {selectedVersions.length === 2 && (
        <DiffViewer 
          open={isDiffOpen}
          onOpenChange={setIsDiffOpen}
          oldValue={selectedVersions[0].content}
          newValue={selectedVersions[1].content}
          oldVersion={selectedVersions[0].version_number}
          newVersion={selectedVersions[1].version_number}
        />
      )}
    </div>
  )
}
