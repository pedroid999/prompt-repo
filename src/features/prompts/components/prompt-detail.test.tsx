import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptDetail } from './prompt-detail';
import { PromptWithLatestVersion, PromptVersion } from '../types';
import * as queryModule from '../queries/get-prompt-history';

// Mock next/navigation (useRouter added for router.refresh after save)
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

// Mock Server Actions/Queries
vi.mock('../queries/get-prompt-history', () => ({
  getPromptHistory: vi.fn(),
}));

vi.mock('../actions/restore-version', () => ({
  restoreVersion: vi.fn(),
}));

vi.mock('../actions/save-new-version', () => ({
  saveNewVersion: vi.fn(),
}));

vi.mock('../actions/manage-prompt', () => ({
  updatePromptMetadata: vi.fn(),
  togglePromptPublic: vi.fn(),
}));

// Mock Sonner Toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPrompt: any = {
  id: '1',
  user_id: 'user1',
  title: 'Prompt One',
  description: 'Description One',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  archived_at: null,
  is_public: false,
  latest_content: 'Content One',
  latest_version_id: 'v-latest',
};

const mockHistory: PromptVersion[] = [
  {
    id: 'v1',
    prompt_id: '1',
    version_number: 1,
    content: 'Old Content',
    version_note: 'Initial',
    created_at: new Date().toISOString(),
  }
];

describe('PromptDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt details', () => {
    render(<PromptDetail prompt={mockPrompt} />);

    expect(screen.getByText('Prompt One')).toBeInTheDocument();
    expect(screen.getByText('Content One')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('switches to history tab and fetches data', async () => {
    vi.mocked(queryModule.getPromptHistory).mockResolvedValue(mockHistory);

    render(<PromptDetail prompt={mockPrompt} />);

    const historyTab = screen.getByText('History');
    fireEvent.click(historyTab);

    // Should call fetch
    expect(queryModule.getPromptHistory).toHaveBeenCalledWith('1');

    // Wait for history to load
    await waitFor(() => {
      // In PromptHistory component, we render version_note (Initial) and version_number (v1)
      expect(screen.getByText('Initial')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no prompt is selected', () => {
    render(<PromptDetail prompt={null} />);

    expect(screen.getByText('Select a prompt to view details')).toBeInTheDocument();
  });

  describe('share toggle UI', () => {
    it('shows Share button when prompt is private', () => {
      render(<PromptDetail prompt={{ ...mockPrompt, is_public: false }} />);

      expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument();
    });

    it('shows Public button and Copy link button when prompt is public', () => {
      render(<PromptDetail prompt={{ ...mockPrompt, is_public: true }} />);

      expect(screen.getByRole('button', { name: /public/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });

    it('calls togglePromptPublic with true when Share is clicked on private prompt', async () => {
      const managePromptModule = await import('../actions/manage-prompt');
      vi.mocked(managePromptModule.togglePromptPublic).mockResolvedValue({ success: true });

      render(<PromptDetail prompt={{ ...mockPrompt, is_public: false }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Share' }));

      await waitFor(() => {
        expect(managePromptModule.togglePromptPublic).toHaveBeenCalledWith('1', true);
      });
    });

    it('calls togglePromptPublic with false when Public is clicked on public prompt', async () => {
      const managePromptModule = await import('../actions/manage-prompt');
      vi.mocked(managePromptModule.togglePromptPublic).mockResolvedValue({ success: true });

      render(<PromptDetail prompt={{ ...mockPrompt, is_public: true }} />);
      fireEvent.click(screen.getByRole('button', { name: /public/i }));

      await waitFor(() => {
        expect(managePromptModule.togglePromptPublic).toHaveBeenCalledWith('1', false);
      });
    });
  });

  it('allows editing metadata fields', async () => {
    const managePromptModule = await import('../actions/manage-prompt');
    vi.mocked(managePromptModule.updatePromptMetadata).mockResolvedValue({ success: true });

    render(<PromptDetail prompt={mockPrompt} />);

    fireEvent.click(screen.getByText('Edit Details'));
    fireEvent.change(screen.getByPlaceholderText('Prompt title'), { target: { value: 'Renamed Prompt' } });
    fireEvent.change(screen.getByPlaceholderText('Description (optional)'), { target: { value: 'Updated desc' } });
    fireEvent.click(screen.getByText('Save Details'));

    await waitFor(() => {
      expect(managePromptModule.updatePromptMetadata).toHaveBeenCalledWith('1', {
        title: 'Renamed Prompt',
        description: 'Updated desc',
      });
    });
  });
});
