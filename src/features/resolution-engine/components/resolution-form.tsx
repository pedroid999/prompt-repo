'use client';

import { useForm, useWatch, type Control } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { extractVariables, resolvePrompt } from '@/lib/utils/variable-parser';

import { ResolvedPreview } from './resolved-preview';

interface ResolutionFormProps {
  content: string;
  onValuesChange?: (values: Record<string, string>) => void;
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

export function ResolutionForm({ content, onValuesChange }: ResolutionFormProps) {
  const variables = useMemo(() => extractVariables(content), [content]);

  // Memoize default values to prevent unnecessary re-renders
  const defaultValues = useMemo(() => 
    variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {}),
    [variables]
  );

  const form = useForm<Record<string, string>>({
    defaultValues,
  });

  const { control, reset, getValues } = form;

  // Sync form defaults if content changes
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

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

  // Keyboard shortcut for copy (Cmd+Enter / Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy]);

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
    <div className="space-y-6">
      <FormChangeNotifier control={control} onValuesChange={onValuesChange} />
      
      <Form {...form}>
        <form 
          className="space-y-4 p-4"
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
                <FormItem>
                  <FormLabel className="text-foreground">{variable}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="font-mono bg-background border-border text-foreground focus-visible:ring-ring"
                      autoComplete="off"
                      autoFocus={index === 0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Copy Resolved Prompt
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">Cmd/Ctrl +</span> Enter
              </kbd> to copy instantly
            </p>
          </div>
        </form>
      </Form>
      
      <div className="p-4 border-t border-border">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Preview</h4>
        <LiveResolvedPreview control={control} content={content} />
      </div>
    </div>
  );
}