'use client'

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useEffect, useState } from "react"

const SEARCH_DEBOUNCE_MS = 300;

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    // Avoid double-triggering on initial mount if query matches searchParams
    if (query === initialQuery) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }
      
      startTransition(() => {
        router.push(`/?${params.toString()}`)
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(handler)
  }, [query, router, searchParams, initialQuery])

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727169]" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search prompts..."
        className="pl-10 bg-[#1F1F28] border-[#2D4F67] text-[#DCD7BA] placeholder:text-[#727169] h-10"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
           <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#7E9CD8] border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}
