import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptDetail } from './prompt-detail';
import { PromptWithLatestVersion, PromptVersion } from '../types';
import * as queryModule from '../queries/get-prompt-history';

// Mock Server Actions/Queries
vi.mock('../queries/get-prompt-history', () => ({
  getPromptHistory: vi.fn(),
}));

vi.mock('../actions/restore-version', () => ({
  restoreVersion: vi.fn(),
}));

// Mock Sonner Toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPrompt: PromptWithLatestVersion = {
  id: '1',
  user_id: 'user1',
  title: 'Prompt One',
  description: 'Description One',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  latest_content: 'Content One',
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
});