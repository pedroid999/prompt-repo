import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInWithGithub, signInWithGoogle, signInWithEmail, signOut } from './actions'
import { redirect } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock supabase server client
const mockAuth = {
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}
const mockSupabase = {
  auth: mockAuth,
}
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
  headers: vi.fn(() => ({ get: vi.fn(() => 'http://localhost:3000') })),
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signInWithGithub redirects to provider url', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://github.com/login/oauth/...' },
      error: null,
    })

    await signInWithGithub()

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    })
    expect(redirect).toHaveBeenCalledWith('https://github.com/login/oauth/...')
  })

  it('signInWithGoogle redirects to provider url', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://google.com/o/oauth2/...' },
      error: null,
    })

    await signInWithGoogle()

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    })
    expect(redirect).toHaveBeenCalledWith('https://google.com/o/oauth2/...')
  })

  it('signInWithEmail redirects on success', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: {} },
      error: null,
    })

    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')

    await signInWithEmail(formData)

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('signInWithEmail redirects with error on failure', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login' },
    })

    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'wrong')

    await signInWithEmail(formData)

    expect(redirect).toHaveBeenCalledWith('/auth/login?error=Invalid%20login')
  })

  it('signOut calls supabase signOut and redirects', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null })

    await signOut()

    expect(mockAuth.signOut).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })
})
