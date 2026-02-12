import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPrompts } from './get-prompts'

const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  data: null,
  error: null,
}

mockSupabase.from.mockReturnValue(mockSupabase)
mockSupabase.select.mockReturnValue(mockSupabase)
mockSupabase.eq.mockReturnValue(mockSupabase)
mockSupabase.order.mockReturnValue(mockSupabase) 

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: () => [],
  })),
}))

describe('getPrompts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue(mockSupabase)
    // Default valid empty response
    (mockSupabase as any).data = []
    mockSupabase.error = null
  })

  it('fetches all prompts when no collectionId', async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null })
    
    await getPrompts()
    
    expect(mockSupabase.from).toHaveBeenCalledWith('prompts')
    // We expect the select string NOT to have the inner join
    const selectCall = mockSupabase.select.mock.calls[0][0]
    expect(selectCall).not.toContain('collection_prompts!inner')
  })

  it('filters by collectionId', async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null })
    
    await getPrompts('col-1')
    
    expect(mockSupabase.from).toHaveBeenCalledWith('prompts')
    const selectCall = mockSupabase.select.mock.calls[0][0]
    expect(selectCall).toContain('collection_prompts!inner')
    expect(mockSupabase.eq).toHaveBeenCalledWith('collection_prompts.collection_id', 'col-1')
  })

  it('maps collection_ids correctly', async () => {
    const mockData = [{
      id: '1',
      title: 'Test',
      prompt_versions: [],
      collection_prompts: [{ collection_id: 'c1' }, { collection_id: 'c2' }]
    }]
    mockSupabase.order.mockResolvedValue({ data: mockData, error: null })

    const result = await getPrompts()

    expect(result[0].collection_ids).toEqual(['c1', 'c2'])
  })
})
