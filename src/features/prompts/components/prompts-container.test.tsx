import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptsContainer } from './prompts-container';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));
import { PromptWithLatestVersion } from '../types';

const mockPrompts: any[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Prompt One',
    description: 'Description One',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latest_content: 'Content One',
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'Prompt Two',
    description: 'Description Two',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latest_content: 'Content Two',
  },
];

describe('PromptsContainer', () => {
  it('renders and allows selecting a prompt', () => {
    render(<PromptsContainer prompts={mockPrompts} />);

    // Initially shows first prompt in detail
    expect(screen.getByText('Content One')).toBeInTheDocument();

    // Click on second prompt
    fireEvent.click(screen.getByText('Prompt Two'));

    // Detail should update
    expect(screen.getByText('Content Two')).toBeInTheDocument();
  });

  it('handles empty prompts array', () => {
    render(<PromptsContainer prompts={[]} />);
    expect(screen.getByText('Select a prompt to view details')).toBeInTheDocument();
  });
});
