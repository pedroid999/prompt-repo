import { describe, it, expect, vi, beforeEach } from 'vitest'
import { restoreVersion } from './restore-version'

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  })),
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Restore Version Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('restores a previous version successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(function(this: any) {
        if (this.tableName === 'prompt_versions' && this.isOrder) {
            return Promise.resolve({ data: { version_number: 2 }, error: null })
        }
        if (this.tableName === 'prompt_versions') {
            return Promise.resolve({ data: { id: 'v1', content: 'Old Content', version_number: 1 }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
      order: vi.fn().mockImplementation(function(this: any) {
          this.isOrder = true
          return this
      }),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
    })

    // Re-mocking 'from' to handle internal state for different calls
    mockSupabase.from = vi.fn().mockImplementation((table) => {
        const query: any = {
            tableName: table,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
        }
        query.single.mockImplementation(() => {
            if (table === 'prompt_versions' && query.isOrder) {
                return Promise.resolve({ data: { version_number: 2 }, error: null })
            }
            if (table === 'prompt_versions') {
                return Promise.resolve({ data: { id: 'v1', content: 'Old Content', version_number: 1 }, error: null })
            }
            return Promise.resolve({ data: null, error: null })
        })
        query.order.mockImplementation(() => {
            query.isOrder = true
            return query
        })
        query.insert.mockResolvedValue({ error: null })
        query.update.mockReturnThis()
        return query
    })

    const result = await restoreVersion('p1', 'v1')

    expect(result.success).toBe(true)
    expect(result.newVersion).toBe(3)
  })

  it('returns error if not authorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await restoreVersion('p1', 'v1')

    expect(result.error).toBe('Unauthorized')
  })

  it('returns error if version not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    })

    const result = await restoreVersion('p1', 'v1')

    expect(result.error).toBe('Version not found or access denied')
  })
})
