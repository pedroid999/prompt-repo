import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileForm } from './profile-form'
import { updateProfile } from '@/app/profile/actions'
import { toast } from 'sonner'

// Mock React hooks that might not be available in test env
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useOptimistic: vi.fn((state) => [state, vi.fn()]),
    startTransition: vi.fn((cb) => cb()),
  }
})

// Mock the server action
vi.mock('@/app/profile/actions', () => ({
  updateProfile: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ProfileForm', () => {
  const initialData = {
    display_name: 'Original Name',
    avatar_url: 'https://example.com/original.png',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with initial data', () => {
    render(<ProfileForm initialData={initialData} />)
    
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Original Name')
    expect(screen.getByLabelText(/avatar url/i)).toHaveValue('https://example.com/original.png')
  })

  it('calls updateProfile on submit', async () => {
    (updateProfile as any).mockResolvedValue({ data: {}, error: null })
    
    render(<ProfileForm initialData={initialData} />)
    
    const nameInput = screen.getByLabelText(/display name/i)
    fireEvent.change(nameInput, { target: { value: 'New Name' } })
    
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalled()
    })

    const formData = (updateProfile as any).mock.calls[0][0] as FormData
    expect(formData.get('display_name')).toBe('New Name')
  })

  it('shows success toast on successful update', async () => {
    (updateProfile as any).mockResolvedValue({ data: {}, error: null })
    
    render(<ProfileForm initialData={initialData} />)
    
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Profile updated successfully', expect.objectContaining({
            description: "Your changes have been saved."
        }))
    })
  })

  it('shows error toast on failure', async () => {
    (updateProfile as any).mockResolvedValue({ data: null, error: 'Update failed' })
    
    render(<ProfileForm initialData={initialData} />)
    
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed')
    })
  })
})
