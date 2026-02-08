import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommandPalette } from './command-palette'
import { describe, it, expect, vi } from 'vitest'

// Mock searchPrompts action
vi.mock('@/features/search/actions', () => ({
  searchPrompts: vi.fn().mockResolvedValue({ data: [], error: null }),
}))

// Mock useRouter and useSearchParams
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}))

describe('CommandPalette', () => {
  it('is hidden by default', () => {
    render(<CommandPalette />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens on Cmd+K', async () => {
    render(<CommandPalette />)
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })
  })
  
  it('opens on Ctrl+K', async () => {
    render(<CommandPalette />)
    
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })
  })
})
