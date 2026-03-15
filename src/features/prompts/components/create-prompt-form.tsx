'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { promptCreateSchema, PromptCreateInput } from '@/lib/validation/prompt';
import { savePrompt } from '@/features/prompts/actions/save-prompt';
import { ComposerToolbar, ComposerEditor, DiffDialog } from '@/features/ai-composer/components';
import { useComposer } from '@/features/ai-composer/hooks/use-composer';

export function CreatePromptForm() {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<PromptCreateInput>({
    resolver: zodResolver(promptCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      version_note: '',
    },
  });

  // Sync composer structured content → form content field
  const handleComposerContentChange = useCallback(
    (content: string) => {
      form.setValue('content', content, { shouldValidate: true, shouldDirty: true });
    },
    [form],
  );

  const composer = useComposer({
    initialContent: '',
    onContentChange: handleComposerContentChange,
  });

  async function onSubmit(data: PromptCreateInput) {
    // If in structured mode, ensure the latest structured content is used
    if (composer.mode === 'structured' && composer.structuredContent) {
      data.content = composer.structuredContent;
    }

    setIsPending(true);
    try {
      const result = await savePrompt(data);

      if (result.success) {
        toast.success('Prompt created successfully', {
          description: 'Your new prompt has been saved.',
          style: {
             borderColor: 'var(--success)',
             color: 'var(--success)',
          },
          className: 'border-success text-success',
        });
        form.reset();
        // Reset composer state after successful save
        composer.setBrainstormContent('');
        composer.setStructuredContent('');
        composer.setMode('brainstorm');
      } else {
        toast.error('Failed to create prompt', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm">Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter prompt title" {...field} className="h-9 md:h-10" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm">Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your prompt (optional)"
                  className="resize-none min-h-[60px] md:min-h-[80px] text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Briefly describe what this prompt does.
              </FormDescription>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm">Prompt Content</FormLabel>
              {/* AI Composer Toolbar */}
              <ComposerToolbar
                mode={composer.mode}
                onModeChange={composer.setMode}
                availableProviders={composer.availableProviders}
                selectedProvider={composer.selectedProvider}
                onProviderChange={composer.setSelectedProvider}
                availableModels={composer.availableModels}
                selectedModel={composer.selectedModel}
                onModelChange={composer.setSelectedModel}
                isStructuring={composer.isStructuring}
                onStructure={composer.triggerStructure}
                hasBrainstormContent={composer.brainstormContent.trim().length > 0}
              />
              {/* AI Composer Editor (replaces plain Textarea) */}
              <FormControl>
                <ComposerEditor
                  mode={composer.mode}
                  brainstormContent={composer.brainstormContent}
                  onBrainstormChange={composer.setBrainstormContent}
                  structuredContent={field.value}
                  onStructuredChange={(value) => {
                    field.onChange(value);
                    composer.setStructuredContent(value);
                  }}
                  isStructuring={composer.isStructuring}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Use brainstorm mode to draft ideas, then click &quot;Structure with AI&quot; to transform them into a polished prompt. Or write directly in structured mode.
              </FormDescription>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="version_note"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm">Version Note</FormLabel>
              <FormControl>
                <Input placeholder="Initial version" {...field} className="h-9 md:h-10 text-sm" />
              </FormControl>
              <FormDescription className="text-xs">
                A note for this version of the prompt.
              </FormDescription>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full md:w-auto h-9 md:h-10">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Saving...' : 'Save Prompt'}
        </Button>
      </form>

      {/* AI Diff Dialog — shows when AI structuring produces a result */}
      <DiffDialog
        open={composer.isDiffOpen}
        onOpenChange={composer.setDiffOpen}
        originalText={composer.brainstormContent}
        structuredText={composer.pendingResult?.structuredContent ?? ''}
        model={composer.pendingResult?.model}
        onAccept={composer.acceptResult}
        onReject={composer.rejectResult}
      />
    </Form>
  );
}
