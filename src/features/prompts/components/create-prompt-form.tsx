'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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

  async function onSubmit(data: PromptCreateInput) {
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
              <FormControl>
                <Textarea 
                  placeholder="Write your prompt content here..." 
                  className="min-h-[150px] md:min-h-[200px] font-mono text-sm"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-xs">
                The actual content of the prompt. Supports markdown.
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
    </Form>
  );
}
