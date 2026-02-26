'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { saveSnapshot } from '../actions';

interface SaveSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptVersionId: string;
  variables: Record<string, string>;
  onSuccess?: () => void;
}

export function SaveSnapshotDialog({
  open,
  onOpenChange,
  promptVersionId,
  variables,
  onSuccess,
}: SaveSnapshotDialogProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the snapshot');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveSnapshot({
        name,
        prompt_version_id: promptVersionId,
        variables,
      });

      if (result.success) {
        toast.success('Snapshot saved successfully');
        onOpenChange(false);
        setName('');
        onSuccess?.();
      } else {
        toast.error('Failed to save snapshot', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Save Snapshot</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Give your snapshot a name to reuse these variable values later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-foreground">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 bg-background border-border text-foreground"
              placeholder="e.g., Marketing Copy v1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground"
          >
            {isSaving ? 'Saving...' : 'Save Snapshot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
