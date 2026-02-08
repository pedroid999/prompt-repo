import { CreatePromptForm } from '@/features/prompts/components/create-prompt-form';

export default function CreatePromptPage() {
  return (
    <div className="container max-w-2xl p-4 md:py-10">
      <div className="mb-4 md:mb-8 space-y-1 md:space-y-2">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Create Prompt</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Create a new prompt to add to your collection.
        </p>
      </div>
      <CreatePromptForm />
    </div>
  );
}
