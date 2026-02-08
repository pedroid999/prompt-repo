import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SignOutButton } from './sign-out-button'

vi.mock('@/app/auth/actions', () => ({
  signOut: vi.fn(),
}))

describe('SignOutButton', () => {
  it('renders a button', () => {
    render(<SignOutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
