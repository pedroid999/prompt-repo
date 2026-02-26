import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiffViewer } from './diff-viewer';

// Mock the diff calculation to control test output
vi.mock('../utils/diff', () => ({
  calculateDiff: vi.fn(() => [
    { content: 'shared context', type: 'unchanged', oldLineNumber: 1, newLineNumber: 1 },
    { content: 'removed line', type: 'removed', oldLineNumber: 2 },
    { content: 'added line', type: 'added', newLineNumber: 2 },
  ]),
}));

const defaultProps = {
  oldValue: 'shared context\nremoved line',
  newValue: 'shared context\nadded line',
  oldVersion: 3,
  newVersion: 4,
  open: true,
  onOpenChange: vi.fn(),
};

describe('DiffViewer', () => {
  it('renders the version comparison dialog when open', () => {
    render(<DiffViewer {...defaultProps} />);

    expect(screen.getByText('Version Comparison')).toBeInTheDocument();
    expect(screen.getByText(/Comparing v3 → v4/)).toBeInTheDocument();
  });

  it('renders all diff lines (unchanged, removed, and added)', () => {
    render(<DiffViewer {...defaultProps} />);

    expect(screen.getByText('shared context')).toBeInTheDocument();
    expect(screen.getByText('removed line')).toBeInTheDocument();
    expect(screen.getByText('added line')).toBeInTheDocument();
  });

  it('shows the legend with Deletions and Additions labels', () => {
    render(<DiffViewer {...defaultProps} />);

    expect(screen.getByText('Deletions')).toBeInTheDocument();
    expect(screen.getByText('Additions')).toBeInTheDocument();
  });

  it('shows Esc hint in the footer', () => {
    render(<DiffViewer {...defaultProps} />);

    expect(screen.getByText('Press Esc to close')).toBeInTheDocument();
  });

  it('does not render dialog content when closed', () => {
    render(<DiffViewer {...defaultProps} open={false} />);

    expect(screen.queryByText('Version Comparison')).not.toBeInTheDocument();
  });
});
