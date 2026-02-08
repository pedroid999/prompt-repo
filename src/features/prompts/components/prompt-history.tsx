'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { History, RotateCcw } from "lucide-react"
import { PromptVersion } from "../types"
import { cn } from "@/lib/utils"

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
  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-l border-sidebar-border", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-sidebar-border bg-sidebar">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">History</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-3 md:p-4 gap-4 md:gap-6 relative">
            {/* Vertical Line */}
            <div className="absolute left-[23px] md:left-[27px] top-6 bottom-6 w-px bg-border z-0" />
            
            {versions.map((version, index) => {
              const isLatest = index === 0;
              return (
                <div key={version.id} className="relative z-10 flex gap-3 md:gap-4 group">
                    {/* Timeline Node */}
                    <div className="flex-none mt-1">
                      <div className={cn(
                        "h-3 w-3 rounded-full transition-colors ring-4 ring-sidebar",
                        isLatest ? "bg-primary" : "bg-border group-hover:bg-primary/50"
                      )} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-medium text-primary shrink-0">v{version.version_number}</span>
                        {isLatest && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">HEAD</span>
                        )}
                        <span className="text-xs text-muted-foreground truncate">{getRelativeTime(version.created_at)}</span>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => onRestore(version.id)}
                            title="Restore this version"
                        >
                            <RotateCcw className="h-3 w-3" />
                            <span className="sr-only">Restore</span>
                        </Button>
                    </div>
                    
                    {version.version_note && (
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">{version.version_note}</p>
                    )}
                    </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  )
}
