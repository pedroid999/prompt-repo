import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BackButton } from './back-button'

const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}))

describe('BackButton', () => {
  it('renders with "Back" text', () => {
    render(<BackButton />)
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('renders an arrow icon', () => {
    render(<BackButton />)
    const button = screen.getByRole('button', { name: /back/i })
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('calls router.back() when clicked', () => {
    mockBack.mockClear()
    render(<BackButton />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('renders as a button element for keyboard accessibility', () => {
    render(<BackButton />)
    const button = screen.getByRole('button', { name: /back/i })
    expect(button.tagName).toBe('BUTTON')
  })
})
