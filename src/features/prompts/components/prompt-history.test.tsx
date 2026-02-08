import { render, screen } from '@testing-library/react'
import { PromptHistory } from './prompt-history'
import { PromptVersion } from '../types'
import { describe, it, expect, vi } from 'vitest'

// Mock Restore Action (we'll implement this later)
const mockRestoreAction = vi.fn()

const mockVersions: PromptVersion[] = [
  {
    id: 'v2',
    prompt_id: 'p1',
    version_number: 2,
    content: 'New content',
    version_note: 'Updated prompt',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'v1',
    prompt_id: 'p1',
    version_number: 1,
    content: 'Initial content',
    version_note: 'Initial commit',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
]

describe('PromptHistory', () => {
  it('renders a list of versions', () => {
    render(<PromptHistory versions={mockVersions} onRestore={mockRestoreAction} />)
    
    expect(screen.getByText(/Updated prompt/i)).toBeInTheDocument()
    expect(screen.getByText(/Initial commit/i)).toBeInTheDocument()
    expect(screen.getByText(/v2/i)).toBeInTheDocument()
    expect(screen.getByText(/v1/i)).toBeInTheDocument()
  })

  it('renders relative timestamps', () => {
    render(<PromptHistory versions={mockVersions} onRestore={mockRestoreAction} />)
    // We expect some relative time text. Implementation detail depends on how we do it.
    // For now, let's assume we see "ago"
    expect(screen.getAllByText(/ago/i).length).toBeGreaterThan(0)
  })

  it('shows restore button for past versions', () => {
    render(<PromptHistory versions={mockVersions} onRestore={mockRestoreAction} />)
    const restoreButtons = screen.getAllByRole('button', { name: /restore/i })
    expect(restoreButtons).toHaveLength(2)
  })
})
