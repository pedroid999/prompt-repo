import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptList } from './prompt-list';
import { PromptWithLatestVersion } from '../types';

const mockPrompts: PromptWithLatestVersion[] = [
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

  it('highlights the selected prompt', () => {
    const { container } = render(
      <PromptList
        prompts={mockPrompts}
        selectedId="1"
        onSelect={() => {}}
      />
    );

    // Finding the card by checking its classes
    const cards = container.querySelectorAll('.cursor-pointer');
    expect(cards[0].className).toContain('bg-[#2D4F67]');
    expect(cards[1].className).toContain('bg-[#1F1F28]');
  });
});
