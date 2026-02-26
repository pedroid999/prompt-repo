import { getPrompts } from '@/features/prompts/queries/get-prompts';
import { searchPrompts } from '@/features/search/actions';
import { PromptsContainer } from '@/features/prompts/components/prompts-container';
import { SignOutButton } from '@/components/shared/auth/sign-out-button';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/features/search/search-bar';
import { getCollections } from "@/features/collections/actions";
import { MobileNav } from '@/components/features/navigation/mobile-nav';
import { Plus } from 'lucide-react';
import { PromptWithLatestVersion } from '@/features/prompts/types';
import { cn } from '@/lib/utils';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string; collectionId?: string; view?: string }>;
}) {
  const { q: query, id: promptId, collectionId, view } = await searchParams;
  const promptView = view === 'archived' ? 'archived' : 'active';
  let prompts: PromptWithLatestVersion[];

  if (query) {
    const { data, error } = await searchPrompts(query, { collectionId, archived: promptView === 'archived' });
    // Transform SearchResult[] to PromptWithLatestVersion[] if needed
    // Assuming search_prompts RPC already returns collection_ids after DB fix or casting
    prompts = (data as PromptWithLatestVersion[]) || [];
  } else {
    prompts = await getPrompts(collectionId, promptView);
  }

  const { data: collections } = await getCollections();
  const buildHomeHref = (nextView: 'active' | 'archived') => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (promptId) params.set('id', promptId);
    if (collectionId) params.set('collectionId', collectionId);
    if (nextView === 'archived') params.set('view', 'archived');
    const search = params.toString();
    return search ? `/?${search}` : '/';
  };

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
        <div className="hidden sm:flex items-center rounded-md border border-[#2D4F67] p-0.5">
          <Link href={buildHomeHref('active')}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2 text-xs',
                promptView === 'active'
                  ? 'bg-[#2D4F67] text-[#DCD7BA] hover:bg-[#2D4F67]'
                  : 'text-[#727169] hover:text-[#DCD7BA] hover:bg-transparent'
              )}
            >
              Active
            </Button>
          </Link>
          <Link href={buildHomeHref('archived')}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2 text-xs',
                promptView === 'archived'
                  ? 'bg-[#2D4F67] text-[#DCD7BA] hover:bg-[#2D4F67]'
                  : 'text-[#727169] hover:text-[#DCD7BA] hover:bg-transparent'
              )}
            >
              Archived
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-1 md:gap-4 shrink-0">
          <Link href="/prompts/create">
            <Button variant="ghost" size="sm" className="text-[#DCD7BA] hover:bg-[#2D4F67] hover:text-[#DCD7BA] h-8 md:h-10 text-xs md:text-sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Prompt</span>
            </Button>
          </Link>
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
          view={promptView}
          initialSelectedId={promptId} 
        />
      </main>
    </div>
  );
}
