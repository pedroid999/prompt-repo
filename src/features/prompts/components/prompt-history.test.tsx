import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PromptHistory } from './prompt-history'
import { PromptVersion } from '../types'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DiffViewer to avoid Dialog complexity in unit tests
vi.mock('./diff-viewer', () => ({
  DiffViewer: ({ open, oldVersion, newVersion }: any) => 
    open ? <div data-testid="diff-viewer">Comparing v{oldVersion} → v{newVersion}</div> : null
}))

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a list of versions', () => {
    render(<PromptHistory versions={mockVersions} onRestore={mockRestoreAction} />)
    
    expect(screen.getByText(/Updated prompt/i)).toBeInTheDocument()
    expect(screen.getByText(/Initial commit/i)).toBeInTheDocument()
    expect(screen.getByText(/v2/i)).toBeInTheDocument()
    expect(screen.getByText(/v1/i)).toBeInTheDocument()
  })

  it('allows selecting two versions for comparison', async () => {
    render(<PromptHistory versions={mockVersions} onRestore={mockRestoreAction} />)
    
    const v2 = screen.getByText('v2').closest('div[class*="cursor-pointer"]')!
    const v1 = screen.getByText('v1').closest('div[class*="cursor-pointer"]')!
    
    fireEvent.click(v2)
    fireEvent.click(v1)
    
    expect(screen.getByText('2/2 selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /compare selected/i })).toBeInTheDocument()
  })

  it('triggers diff viewer when clicking compare button', async () => {
    render(<PromptHistory versions={mockVersions} onRestore={mockRestoreAction} />)
    
    const v2 = screen.getByText('v2').closest('div[class*="cursor-pointer"]')!
    const v1 = screen.getByText('v1').closest('div[class*="cursor-pointer"]')!
    
    fireEvent.click(v2)
    fireEvent.click(v1)
    
    const compareButton = screen.getByRole('button', { name: /compare selected/i })
    fireEvent.click(compareButton)
    
    expect(screen.getByTestId('diff-viewer')).toBeInTheDocument()
    expect(screen.getByText('Comparing v1 → v2')).toBeInTheDocument()
  })

  it('triggers diff viewer on "D" key press', async () => {
    render(<PromptHistory versions={mockVersions} onRestore={mockRestoreAction} />)
    
    const v2 = screen.getByText('v2').closest('div[class*="cursor-pointer"]')!
    const v1 = screen.getByText('v1').closest('div[class*="cursor-pointer"]')!
    
    fireEvent.click(v2)
    fireEvent.click(v1)
    
    fireEvent.keyDown(window, { key: 'd' })
    
    expect(screen.getByTestId('diff-viewer')).toBeInTheDocument()
  })
})
