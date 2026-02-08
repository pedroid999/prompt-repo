'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SearchResult } from './types'

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  userId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
})

export async function searchPrompts(query: string, options?: { userId?: string; collectionId?: string }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  if (!query || query.trim() === '') {
     // Return empty or fetch all? 
     // For search functionality, usually return empty or handle in component.
     // Let's return null to signify no search performed.
     return { data: [], error: null }
  }

  const validation = searchSchema.safeParse({ query, ...options })
  if (!validation.success) {
    return { data: null, error: 'Invalid search query or parameters' }
  }

  const { data, error } = await supabase.rpc('search_prompts', {
    query_text: query,
    filter_user_id: options?.userId || null,
    filter_collection_id: options?.collectionId || null
  })

  if (error) {
    console.error('Search error:', error)
    return { data: null, error: `Search failed: ${error.message}` }
  }

  return { data: data as SearchResult[], error: null }
}
