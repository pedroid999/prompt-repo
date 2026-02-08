import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfile, updateProfile } from './actions'

// Create a stable chain object
const mockChain = {
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

// Mock supabase server client
const mockSupabase = {
  from: vi.fn(() => mockChain),
  auth: {
    getUser: vi.fn(),
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Profile Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chain mocks default behavior if needed, but simple clear is usually enough if we set return values in tests
  })

  describe('getProfile', () => {
    it('returns profile data when user is authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockChain.single.mockResolvedValue({
        data: { id: 'user-123', display_name: 'Test User', avatar_url: 'https://example.com/avatar.png' },
        error: null
      })

      const result = await getProfile()
      
      expect(result).toEqual({
        data: { id: 'user-123', display_name: 'Test User', avatar_url: 'https://example.com/avatar.png' },
        error: null
      })
    })

    it('returns error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await getProfile()

      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('updateProfile', () => {
    it('updates profile and revalidates path', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockChain.single.mockResolvedValue({
        data: { id: 'user-123', display_name: 'New Name', avatar_url: 'https://new-url.com' },
        error: null
      })

      const formData = new FormData()
      formData.append('display_name', 'New Name')
      formData.append('avatar_url', 'https://new-url.com')

      const result = await updateProfile(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockChain.update).toHaveBeenCalledWith({
        display_name: 'New Name',
        avatar_url: 'https://new-url.com',
        updated_at: expect.any(String)
      })
      expect(result.data).toBeDefined()
    })

    it('returns validation error for invalid data', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
  
        const formData = new FormData()
        formData.append('display_name', 'A') // Too short
        
        const result = await updateProfile(formData)
  
        expect(result.error).toBeDefined()
        expect(mockSupabase.from).not.toHaveBeenCalled()
      })
  })
})