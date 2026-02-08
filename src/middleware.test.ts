import { describe, it, expect, vi, beforeEach } from 'vitest'
import { middleware } from './middleware'
import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(),
}))

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls updateSession', async () => {
    const request = new NextRequest('http://localhost:3000/')
    await middleware(request)
    expect(updateSession).toHaveBeenCalledWith(request)
  })
})
