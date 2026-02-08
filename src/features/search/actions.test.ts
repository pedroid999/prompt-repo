import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchPrompts } from './actions'

const mockSupabase = {
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: () => [],
    get: () => undefined,
  })),
}))

describe('Search Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls search_prompts RPC with query', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [{ id: '1', title: 'Test Prompt', rank: 0.9 }],
      error: null
    })

    const result = await searchPrompts('test')

    expect(mockSupabase.rpc).toHaveBeenCalledWith('search_prompts', {
      query_text: 'test',
      filter_user_id: null,
      filter_collection_id: null
    })
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0].title).toBe('Test Prompt')
  })

  it('calls search_prompts RPC with filters', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null
    })

    const userId = '123e4567-e89b-12d3-a456-426614174000'
    await searchPrompts('test', { userId })

    expect(mockSupabase.rpc).toHaveBeenCalledWith('search_prompts', {
      query_text: 'test',
      filter_user_id: userId,
      filter_collection_id: null
    })
  })

  it('returns empty array for empty query', async () => {
    const result = await searchPrompts('')
    expect(result.data).toEqual([])
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('returns error for invalid query (too long)', async () => {
    const longQuery = 'a'.repeat(501)
    const result = await searchPrompts(longQuery)
    expect(result.error).toBe('Invalid search query or parameters')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('returns error when RPC fails', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'DB Error' }
    })

    const result = await searchPrompts('test')
    expect(result.error).toBe('Search failed: DB Error')
  })
})
