import { CreatePromptForm } from '@/features/prompts/components/create-prompt-form';
import { BackButton } from '@/components/shared/back-button';

export default function CreatePromptPage() {
  return (
    <div className="flex h-full flex-col bg-[#16161D]">
      <header className="flex h-14 items-center border-b border-[#16161D] bg-[#1F1F28] px-4 md:px-6 gap-4">
        <BackButton />
        <h1 className="text-xl font-bold text-[#DCD7BA]">Create Prompt</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl p-4 md:py-10">
          <CreatePromptForm />
        </div>
      </main>
    </div>
  );
}
