import { getPrompts } from '@/features/prompts/queries/get-prompts';
import { searchPrompts } from '@/features/search/actions';
import { PromptsContainer } from '@/features/prompts/components/prompts-container';
import { SignOutButton } from '@/components/shared/auth/sign-out-button';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/features/search/search-bar';
import { getCollections } from "@/features/collections/actions";
import { MobileNav } from '@/components/features/navigation/mobile-nav';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string; collectionId?: string }>;
}) {
  const { q: query, id: promptId, collectionId } = await searchParams;
  let prompts;

  if (query) {
    const { data, error } = await searchPrompts(query, { collectionId });
    prompts = data || [];
  } else {
    prompts = await getPrompts(collectionId);
  }

  const { data: collections } = await getCollections();

  return (
    <div className="flex h-full flex-col bg-[#16161D]">
      <header className="flex h-14 items-center justify-between border-b border-[#16161D] bg-[#1F1F28] px-4 md:px-6 gap-2">
        <div className="flex items-center gap-2 md:gap-8 flex-1 min-w-0">
          <MobileNav collections={collections || []} />
          <h1 className="text-xl font-bold text-[#DCD7BA] hidden sm:block md:hidden shrink-0">PromptRepo</h1>
          <div className="flex-1 min-w-0 max-w-md">
            <SearchBar />
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-4 shrink-0">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="text-[#DCD7BA] hover:bg-[#2D4F67] hover:text-[#DCD7BA] h-8 md:h-10 text-xs md:text-sm">
              Profile
            </Button>
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <PromptsContainer 
          prompts={prompts} 
          collections={collections || []}
          initialSelectedId={promptId} 
        />
      </main>
    </div>
  );
}
