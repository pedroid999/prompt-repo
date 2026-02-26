import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from './page'

// Mock the server actions
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/app/auth/actions', () => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGithub: vi.fn(),
  signInWithGoogle: vi.fn(),
}))

// Mock useFormStatus for SubmitButton
vi.mock('react-dom', () => ({
  useFormStatus: () => ({ pending: false }),
}))

describe('LoginPage', () => {
  it('renders the login form', async () => {
    // Resolve the async component
    const Page = await LoginPage({ searchParams: Promise.resolve({}) })
    render(Page)
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders OAuth buttons', async () => {
    const Page = await LoginPage({ searchParams: Promise.resolve({}) })
    render(Page)
    
    expect(screen.getByText(/github/i)).toBeInTheDocument()
    expect(screen.getByText(/google/i)).toBeInTheDocument()
  })

  it('displays error message when error param is present', async () => {
    const Page = await LoginPage({ searchParams: Promise.resolve({ error: 'Invalid credentials' }) })
    render(Page)
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })
})
