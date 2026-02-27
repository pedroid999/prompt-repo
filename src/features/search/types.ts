export interface SearchResult {
  id: string
  user_id: string
  title: string
  description: string | null
  archived_at: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  latest_content: string
  latest_version_id: string
  collection_ids: string[]
  rank: number
}

export interface SearchOptions {
  query: string
  // Add filters here in the future (e.g., collection_id)
}
