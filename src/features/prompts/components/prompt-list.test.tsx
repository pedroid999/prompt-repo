import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptList } from './prompt-list';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

vi.mock('@/features/collections/actions', () => ({
  addToCollection: vi.fn(),
  removeFromCollection: vi.fn(),
}));

vi.mock('@/features/prompts/actions/manage-prompt', () => ({
  archivePrompt: vi.fn(),
  restorePrompt: vi.fn(),
  deletePrompt: vi.fn(),
}));

const mockPrompts: any[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Prompt One',
    description: 'Description One',
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latest_content: 'Content One',
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'Prompt Two',
    description: 'Description Two',
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latest_content: 'Content Two',
  },
];

describe('PromptList', () => {
  it('renders a list of prompts', () => {
    render(
      <PromptList
        prompts={mockPrompts}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('Prompt One')).toBeInTheDocument();
    expect(screen.getByText('Prompt Two')).toBeInTheDocument();
    expect(screen.getByText('Description One')).toBeInTheDocument();
    expect(screen.getByText('Description Two')).toBeInTheDocument();
  });

  it('calls onSelect when a prompt is clicked', () => {
    const onSelect = vi.fn();
    render(
      <PromptList
        prompts={mockPrompts}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Prompt One'));
    expect(onSelect).toHaveBeenCalledWith(mockPrompts[0]);
  });

  it('shows empty state when no prompts are provided', () => {
    render(
      <PromptList
        prompts={[]}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('No prompts found.')).toBeInTheDocument();
  });

  it('highlights the selected prompt with an accent border', () => {
    const { container } = render(
      <PromptList
        prompts={mockPrompts}
        selectedId="1"
        onSelect={() => {}}
      />
    );

    // Selected item has the accent border class; non-selected has transparent border
    const buttons = container.querySelectorAll('button[type="button"]');
    expect(buttons[0].className).toContain('border-l-[#7E9CD8]');
    expect(buttons[1].className).toContain('border-l-transparent');
  });
});
