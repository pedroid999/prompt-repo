import { notFound } from 'next/navigation';
import { getPublicPrompt } from '@/features/prompts/queries/get-public-prompt';

interface PublicPromptPageProps {
  params: Promise<{ promptId: string }>;
}

export default async function PublicPromptPage({ params }: PublicPromptPageProps) {
  const { promptId } = await params;
  const prompt = await getPublicPrompt(promptId);

  if (!prompt) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{prompt.title}</h1>
          {prompt.description && (
            <p className="text-sm text-muted-foreground">{prompt.description}</p>
          )}
        </div>
        <div className="rounded-md border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap shadow-sm">
          {prompt.latest_content}
        </div>
      </div>
    </div>
  );
}
