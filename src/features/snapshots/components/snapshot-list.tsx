'use client';

import { useState, useEffect } from 'react';
import { getSnapshots } from '../queries';
import { PromptSnapshot } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { resolvePrompt } from '@/lib/utils/variable-parser';
import { Copy, Clock } from 'lucide-react';

interface SnapshotListProps {
  promptVersionId: string;
  promptContent: string;
  onSelect?: (snapshot: PromptSnapshot) => void;
}

export function SnapshotList({ promptVersionId, promptContent, onSelect }: SnapshotListProps) {
  const [snapshots, setSnapshots] = useState<PromptSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getSnapshots(promptVersionId).then((data) => {
      if (isMounted) {
        setSnapshots(data as PromptSnapshot[]);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [promptVersionId]);

  const handleCopy = (snapshot: PromptSnapshot) => {
    const resolved = resolvePrompt(promptContent, snapshot.variables);
    
    if (!navigator?.clipboard) {
      toast.error('Clipboard API unavailable');
      return;
    }

    navigator.clipboard.writeText(resolved).then(() => {
      toast.success('Copied to clipboard', {
        description: `Snapshot "${snapshot.name}" resolved and copied.`,
      });
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading snapshots...</div>;
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
        <p className="text-muted-foreground italic">No snapshots saved for this version.</p>
        <p className="text-xs text-muted-foreground">Snapshots preserve variable values for a specific prompt version.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4 md:p-6">
      <div className="grid gap-4">
        {snapshots.map((snapshot) => (
          <Card key={snapshot.id} className="bg-card border-border shadow-sm">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground truncate">
                  {snapshot.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(snapshot.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                {Object.entries(snapshot.variables).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border max-w-[150px]">
                    <span className="truncate">{key}: {value}</span>
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={() => handleCopy(snapshot)} 
                  size="sm" 
                  variant="secondary"
                  className="flex-1 h-8 text-xs gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                {onSelect && (
                  <Button
                    onClick={() => onSelect(snapshot)}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-2 border-primary/20 hover:border-primary/50 text-primary"
                  >
                    Apply to Form
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
