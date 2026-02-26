import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCollection, getCollections, deleteCollection, addToCollection, removeFromCollection, updateCollection } from './actions'

// Create a mock object that simulates the Supabase query builder
const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
  // Properties to be returned when awaited
  data: null,
  error: null,
}

// Make chainable methods return the mock object itself
mockSupabase.from.mockReturnValue(mockSupabase)
mockSupabase.select.mockReturnValue(mockSupabase)
mockSupabase.insert.mockReturnValue(mockSupabase)
mockSupabase.update.mockReturnValue(mockSupabase)
mockSupabase.delete.mockReturnValue(mockSupabase)
mockSupabase.eq.mockReturnValue(mockSupabase)
mockSupabase.order.mockReturnValue(mockSupabase)

// single() usually returns a promise with data
mockSupabase.single.mockResolvedValue({ data: null, error: null })

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: () => [],
  })),
}))

describe('Collection Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default return values
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    
    // Default success state
    (mockSupabase as any).data = []
    mockSupabase.error = null
    
    // For single(), we need to mock the resolution
    mockSupabase.single.mockResolvedValue({ data: { id: '1' }, error: null })
  })

  describe('createCollection', () => {
    it('creates a collection successfully', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '1', name: 'Test' }, error: null })
      
      const result = await createCollection({ name: 'Test Collection' })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('collections')
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Collection'
      }))
      expect(result.data).toBeDefined()
    })

    it('validates input', async () => {
      const result = await createCollection({ name: '' })
      expect(result.error).toBeDefined()
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })
  })

  describe('updateCollection', () => {
    it('updates a collection successfully', async () => {
      const result = await updateCollection('123', { name: 'New Name' })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('collections')
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Name'
      }))
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123')
      expect(result.error).toBeNull()
    })

    it('validates input', async () => {
      const result = await updateCollection('123', { name: '' })
      expect(result.error).toBeDefined()
      expect(mockSupabase.update).not.toHaveBeenCalled()
    })
  })

  describe('getCollections', () => {
    it('fetches collections', async () => {
        // Mock data property for the awaited result
        mockSupabase.data = [{ id: '1', name: 'Test' }] as never
        
        const result = await getCollections()
        
        expect(mockSupabase.from).toHaveBeenCalledWith('collections')
        expect(mockSupabase.select).toHaveBeenCalled()
        expect(result.data).toHaveLength(1)
    })
  })
  
  describe('deleteCollection', () => {
      it('deletes a collection', async () => {
          const result = await deleteCollection('123')
          
          expect(mockSupabase.from).toHaveBeenCalledWith('collections')
          expect(mockSupabase.delete).toHaveBeenCalled()
          expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123')
          expect(result.error).toBeNull()
      })
  })

  describe('addToCollection', () => {
      it('adds prompt to collection', async () => {
          // insert returns mockSupabase (which has error: null)
          
          const result = await addToCollection('prompt-1', 'col-1')
          
          expect(mockSupabase.from).toHaveBeenCalledWith('collection_prompts')
          expect(mockSupabase.insert).toHaveBeenCalledWith({
              prompt_id: 'prompt-1',
              collection_id: 'col-1'
          })
          expect(result.error).toBeNull()
      })
  })

  describe('removeFromCollection', () => {
      it('removes prompt from collection', async () => {
          const result = await removeFromCollection('prompt-1', 'col-1')
          
          expect(mockSupabase.from).toHaveBeenCalledWith('collection_prompts')
          expect(mockSupabase.delete).toHaveBeenCalled()
          expect(mockSupabase.eq).toHaveBeenCalledWith('collection_id', 'col-1')
          expect(mockSupabase.eq).toHaveBeenCalledWith('prompt_id', 'prompt-1')
          expect(result.error).toBeNull()
      })
  })
})