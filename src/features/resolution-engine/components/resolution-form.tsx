'use client';

import { useForm, useWatch, type Control } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { extractVariables, resolvePrompt } from '@/lib/utils/variable-parser';
import { hydrateResolutionForm } from '../utils/hydration';

import { ResolvedPreview } from './resolved-preview';
import { SaveSnapshotDialog } from '@/features/snapshots/components/save-snapshot-dialog';
import { useState } from 'react';

interface ResolutionFormProps {
  content: string;
  promptVersionId?: string;
  onSnapshotSaved?: () => void;
  onValuesChange?: (values: Record<string, string>) => void;
  initialValues?: Record<string, string>;
  hydrationId?: number;
}

// Internal component to handle real-time preview updates without re-rendering the whole form
function LiveResolvedPreview({ control, content }: { control: Control<Record<string, string>>, content: string }) {
  const values = useWatch({ control });
  // useWatch returns undefined for unregistered fields, but we initialize them.
  // Cast to Record<string, string> to match ResolvedPreview props
  return <ResolvedPreview content={content} values={values as Record<string, string>} />;
}

// Internal component to handle parent notification without re-rendering the whole form
function FormChangeNotifier({ 
  control, 
  onValuesChange 
}: { 
  control: Control<Record<string, string>>, 
  onValuesChange?: (values: Record<string, string>) => void 
}) {
  const values = useWatch({ control });
  const onValuesChangeRef = useRef(onValuesChange);

  useEffect(() => {
    onValuesChangeRef.current = onValuesChange;
  }, [onValuesChange]);

  useEffect(() => {
    if (onValuesChangeRef.current) {
      onValuesChangeRef.current(values as Record<string, string>);
    }
  }, [values]);

  return null;
}

export function ResolutionForm({ 
  content, 
  promptVersionId, 
  onSnapshotSaved,
  onValuesChange,
  initialValues,
  hydrationId
}: ResolutionFormProps) {
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);
  const lastHydrationId = useRef<number | undefined>(undefined);
  const variables = useMemo(() => extractVariables(content), [content]);

  // Memoize default values to prevent unnecessary re-renders
  const defaultValues = useMemo(() => 
    variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {}),
    [variables]
  );

  // Determine the current values for the form (either snapshot or defaults)
  const formValues = useMemo(() => {
    if (initialValues) {
      return hydrateResolutionForm(variables, initialValues);
    }
    return defaultValues;
  }, [variables, initialValues, defaultValues]);

  const form = useForm<Record<string, string>>({
    values: formValues,
  });

  const { control, reset, getValues } = form;

  // Handle toast notification for hydration
  useEffect(() => {
    if (initialValues && hydrationId !== lastHydrationId.current) {
      lastHydrationId.current = hydrationId;
      
      toast.dismiss('hydration-toast');
      toast.success('Snapshot Applied', {
        id: 'hydration-toast',
        description: 'Form fields have been populated from the snapshot.',
        className: 'bg-background border-primary text-primary',
        icon: <div className="h-4 w-4 rounded-full bg-primary" />,
      });
    }
  }, [initialValues, hydrationId]);

  const handleCopy = useCallback(() => {
    const values = getValues();
    const resolved = resolvePrompt(content, values);
    
    if (!navigator?.clipboard) {
      toast.error('Clipboard API unavailable', {
        description: 'Please copy the text manually.',
      });
      return;
    }

    navigator.clipboard.writeText(resolved).then(() => {
      toast.success('Copied to clipboard', {
        description: 'The resolved prompt is ready to paste.',
        className: 'bg-background border-success text-success',
        icon: <div className="h-4 w-4 rounded-full bg-success" />,
      });
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy', {
        description: 'Please try again or copy manually.',
      });
    });
  }, [content, getValues]);

  // Keyboard shortcut for copy (Cmd+Enter / Ctrl+Enter) and Save Snapshot (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCopy();
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && promptVersionId) {
        e.preventDefault();
        setIsSnapshotDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, promptVersionId]);

  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground italic">No variables detected.</p>
        <Button onClick={handleCopy} variant="outline">
          Copy Resolved Prompt
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <FormChangeNotifier control={control} onValuesChange={onValuesChange} />

      <Form {...form}>
        <form
          className="space-y-3 md:space-y-4 p-4 md:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleCopy();
          }}
        >
          {variables.map((variable, index) => (
            <FormField
              key={variable}
              control={control}
              name={variable}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs md:text-sm text-foreground">{variable}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-8 md:h-10 font-mono text-sm bg-background border-border text-foreground focus-visible:ring-ring"
                      autoComplete="off"
                      autoFocus={index === 0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full h-9 md:h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              Copy Resolved Prompt
            </Button>
            
            {promptVersionId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSnapshotDialogOpen(true)}
                className="w-full h-9 md:h-10 border-border text-foreground hover:bg-muted text-sm"
              >
                Save Snapshot
              </Button>
            )}

            <div className="mt-2 text-center text-xs text-muted-foreground space-y-1">
              <p>
                Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-[10px]">Cmd/Ctrl +</span> Enter
                </kbd> to copy
              </p>
              {promptVersionId && (
                <p>
                  Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-[10px]">Cmd/Ctrl +</span> S
                  </kbd> to save snapshot
                </p>
              )}
            </div>
          </div>
        </form>
      </Form>

      <div className="p-4 md:p-6 border-t border-border">
        <h4 className="mb-2 text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Preview</h4>
        <LiveResolvedPreview control={control} content={content} />
      </div>

      {promptVersionId && (
        <SaveSnapshotDialog
          open={isSnapshotDialogOpen}
          onOpenChange={setIsSnapshotDialogOpen}
          promptVersionId={promptVersionId}
          variables={getValues()}
          onSuccess={onSnapshotSaved}
        />
      )}
    </div>
  );
}

  