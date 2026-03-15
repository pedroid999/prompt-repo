import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComposerToolbar, type ComposerToolbarProps } from './composer-toolbar';

const defaultProps: ComposerToolbarProps = {
  mode: 'brainstorm',
  onModeChange: vi.fn(),
  availableProviders: ['claude', 'openai'],
  selectedProvider: 'claude',
  onProviderChange: vi.fn(),
  availableModels: ['claude-sonnet-4-20250514'],
  selectedModel: 'claude-sonnet-4-20250514',
  onModelChange: vi.fn(),
  isStructuring: false,
  onStructure: vi.fn(),
  hasBrainstormContent: true,
};

describe('ComposerToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mode toggle buttons and Structure button', () => {
    render(<ComposerToolbar {...defaultProps} />);

    expect(screen.getByText('Brainstorm')).toBeInTheDocument();
    expect(screen.getByText('Structured')).toBeInTheDocument();
    expect(screen.getByText('Structure with AI')).toBeInTheDocument();
  });

  it('renders provider selector with available providers', () => {
    render(<ComposerToolbar {...defaultProps} />);

    const providerSelect = screen.getAllByRole('combobox')[0];
    expect(providerSelect).toBeInTheDocument();

    // Check that provider options exist
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('disables Structure button when no providers are configured', () => {
    render(
      <ComposerToolbar
        {...defaultProps}
        availableProviders={[]}
        selectedProvider={null}
      />,
    );

    const structureBtn = screen.getByText('Structure with AI').closest('button')!;
    expect(structureBtn).toBeDisabled();
  });

  it('disables Structure button when brainstorm content is empty', () => {
    render(
      <ComposerToolbar {...defaultProps} hasBrainstormContent={false} />,
    );

    const structureBtn = screen.getByText('Structure with AI').closest('button')!;
    expect(structureBtn).toBeDisabled();
  });

  it('shows loading state during structuring', () => {
    render(<ComposerToolbar {...defaultProps} isStructuring={true} />);

    expect(screen.getByText('Structuring...')).toBeInTheDocument();
    const structureBtn = screen.getByText('Structuring...').closest('button')!;
    expect(structureBtn).toBeDisabled();
  });

  it('calls onStructure when Structure button is clicked', () => {
    render(<ComposerToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Structure with AI'));
    expect(defaultProps.onStructure).toHaveBeenCalledTimes(1);
  });

  it('calls onModeChange when toggling to structured mode', () => {
    render(<ComposerToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Structured'));
    expect(defaultProps.onModeChange).toHaveBeenCalledWith('structured');
  });

  it('calls onModeChange when toggling to brainstorm mode', () => {
    render(<ComposerToolbar {...defaultProps} mode="structured" />);

    fireEvent.click(screen.getByText('Brainstorm'));
    expect(defaultProps.onModeChange).toHaveBeenCalledWith('brainstorm');
  });

  it('hides provider/model selectors in structured mode', () => {
    render(<ComposerToolbar {...defaultProps} mode="structured" />);

    // The provider selector should not be rendered
    expect(screen.queryByText('Claude')).not.toBeInTheDocument();
  });

  it('shows "No providers configured" when list is empty', () => {
    render(
      <ComposerToolbar
        {...defaultProps}
        availableProviders={[]}
        selectedProvider={null}
        availableModels={[]}
        selectedModel=""
      />,
    );

    expect(screen.getByText('No providers configured')).toBeInTheDocument();
  });

  it('disables Structure button in structured mode', () => {
    render(<ComposerToolbar {...defaultProps} mode="structured" />);

    const structureBtn = screen.getByText('Structure with AI').closest('button')!;
    expect(structureBtn).toBeDisabled();
  });
});
