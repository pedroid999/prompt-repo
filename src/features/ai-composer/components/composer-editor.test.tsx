import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComposerEditor, type ComposerEditorProps } from './composer-editor';

const defaultProps: ComposerEditorProps = {
  mode: 'brainstorm',
  brainstormContent: 'some brainstorm notes',
  onBrainstormChange: vi.fn(),
  structuredContent: '# Structured prompt',
  onStructuredChange: vi.fn(),
  isStructuring: false,
};

describe('ComposerEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brainstorm content in brainstorm mode', () => {
    render(<ComposerEditor {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('some brainstorm notes');
  });

  it('renders structured content in structured mode', () => {
    render(<ComposerEditor {...defaultProps} mode="structured" />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('# Structured prompt');
  });

  it('shows brainstorm placeholder in brainstorm mode', () => {
    render(
      <ComposerEditor
        {...defaultProps}
        brainstormContent=""
      />,
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.getAttribute('placeholder')).toContain(
      'Write your ideas',
    );
  });

  it('shows structured placeholder in structured mode', () => {
    render(
      <ComposerEditor
        {...defaultProps}
        mode="structured"
        structuredContent=""
      />,
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.getAttribute('placeholder')).toContain(
      'structured prompt content',
    );
  });

  it('calls onBrainstormChange when typing in brainstorm mode', () => {
    render(<ComposerEditor {...defaultProps} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'updated notes' },
    });

    expect(defaultProps.onBrainstormChange).toHaveBeenCalledWith(
      'updated notes',
    );
    expect(defaultProps.onStructuredChange).not.toHaveBeenCalled();
  });

  it('calls onStructuredChange when typing in structured mode', () => {
    render(<ComposerEditor {...defaultProps} mode="structured" />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '# Updated' },
    });

    expect(defaultProps.onStructuredChange).toHaveBeenCalledWith('# Updated');
    expect(defaultProps.onBrainstormChange).not.toHaveBeenCalled();
  });

  it('disables textarea and shows overlay when structuring', () => {
    render(<ComposerEditor {...defaultProps} isStructuring={true} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(
      screen.getByText('AI is structuring your prompt...'),
    ).toBeInTheDocument();
  });

  it('does not show structuring overlay when not structuring', () => {
    render(<ComposerEditor {...defaultProps} />);

    expect(
      screen.queryByText('AI is structuring your prompt...'),
    ).not.toBeInTheDocument();
  });
});
