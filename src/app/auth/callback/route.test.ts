import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const mockAuth = {
  exchangeCodeForSession: vi.fn(),
}
const mockSupabase = {
  auth: mockAuth,
}
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}))

describe('Auth Callback Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exchanges code for session and redirects to next', async () => {
    mockAuth.exchangeCodeForSession.mockResolvedValue({ error: null })
    const request = new NextRequest('http://localhost:3000/auth/callback?code=123&next=/dashboard')

    await GET(request)

    expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith('123')
    expect(redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard')
  })

  it('redirects to home if no next param', async () => {
    mockAuth.exchangeCodeForSession.mockResolvedValue({ error: null })
    const request = new NextRequest('http://localhost:3000/auth/callback?code=123')

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('http://localhost:3000/')
  })

  it('sanitizes open redirects in next param', async () => {
    mockAuth.exchangeCodeForSession.mockResolvedValue({ error: null })
    // malicious.com should be ignored, defaulting to /
    const request = new NextRequest('http://localhost:3000/auth/callback?code=123&next=//malicious.com')

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('http://localhost:3000/')
  })

  it('redirects to auth error page on exchange failure', async () => {
    mockAuth.exchangeCodeForSession.mockResolvedValue({ error: { message: 'Failed' } })
    const request = new NextRequest('http://localhost:3000/auth/callback?code=123')

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/auth/auth-error')
  })

  it('redirects to auth error page if no code', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback')

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/auth/auth-error')
  })
})
