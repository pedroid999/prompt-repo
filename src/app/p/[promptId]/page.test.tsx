import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicPromptPage from './page';

const mockNotFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); });

vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}));

vi.mock('@/features/prompts/queries/get-public-prompt', () => ({
  getPublicPrompt: vi.fn(),
}));

describe('PublicPromptPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt title and content for a public prompt', async () => {
    const { getPublicPrompt } = await import('@/features/prompts/queries/get-public-prompt');
    vi.mocked(getPublicPrompt).mockResolvedValue({
      id: 'p1',
      title: 'My Shared Prompt',
      description: 'A helpful description',
      latest_content: 'You are a helpful assistant.',
    });

    const Page = await PublicPromptPage({ params: Promise.resolve({ promptId: 'p1' }) });
    render(Page);

    expect(screen.getByRole('heading', { name: 'My Shared Prompt' })).toBeInTheDocument();
    expect(screen.getByText('A helpful description')).toBeInTheDocument();
    expect(screen.getByText('You are a helpful assistant.')).toBeInTheDocument();
  });

  it('renders without description when description is null', async () => {
    const { getPublicPrompt } = await import('@/features/prompts/queries/get-public-prompt');
    vi.mocked(getPublicPrompt).mockResolvedValue({
      id: 'p2',
      title: 'No Description',
      description: null,
      latest_content: 'Prompt content here.',
    });

    const Page = await PublicPromptPage({ params: Promise.resolve({ promptId: 'p2' }) });
    render(Page);

    expect(screen.getByRole('heading', { name: 'No Description' })).toBeInTheDocument();
    expect(screen.getByText('Prompt content here.')).toBeInTheDocument();
  });

  it('calls notFound when getPublicPrompt returns null', async () => {
    const { getPublicPrompt } = await import('@/features/prompts/queries/get-public-prompt');
    vi.mocked(getPublicPrompt).mockResolvedValue(null);

    await expect(
      PublicPromptPage({ params: Promise.resolve({ promptId: 'private-id' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalled();
  });
});
