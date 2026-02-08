"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, User } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { searchPrompts } from "@/features/search/actions"
import { SearchResult } from "@/features/search/types"

const SEARCH_DEBOUNCE_MS = 300;

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (!open) return;
    
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length === 0) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const { data } = await searchPrompts(query)
        if (data) {
          setResults(data)
        }
      } catch (error) {
        console.error("Search failed", error)
      } finally {
        setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [query, open])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const handlePromptSelect = (promptId: string) => {
    runCommand(() => {
      const params = new URLSearchParams(searchParams)
      params.set('id', promptId)
      router.push(`/?${params.toString()}`)
    })
  }

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      commandProps={{ shouldFilter: false }}
    >
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query}
        onValueChange={setQuery}
        className="font-mono"
      />
      <CommandList className="font-mono">
        <CommandEmpty>
          {loading ? "Searching..." : "No results found."}
        </CommandEmpty>
        
        {results.length > 0 && (
           <CommandGroup heading="Prompts">
             {results.map((prompt) => (
               <CommandItem
                 key={prompt.id}
                 value={prompt.title}
                 onSelect={() => handlePromptSelect(prompt.id)}
                 className="flex flex-col items-start gap-1"
               >
                 <span>{prompt.title}</span>
                 {prompt.description && (
                   <span className="text-xs text-muted-foreground truncate w-full">
                     {prompt.description}
                   </span>
                 )}
               </CommandItem>
             ))}
           </CommandGroup>
        )}
        
        {query === "" && (
             <CommandGroup heading="Suggestions">
               <CommandItem value="library" onSelect={() => runCommand(() => router.push('/'))}>
                 <Search className="mr-2 h-4 w-4" />
                 <span>Library</span>
               </CommandItem>
               <CommandItem value="profile" onSelect={() => runCommand(() => router.push('/profile'))}>
                 <User className="mr-2 h-4 w-4" />
                 <span>Profile</span>
               </CommandItem>
            </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
