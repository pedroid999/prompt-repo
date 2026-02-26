import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveSnapshotDialog } from './save-snapshot-dialog';
import { toast } from 'sonner';

vi.mock('../actions', () => ({
  saveSnapshot: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import * as actions from '../actions';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  promptVersionId: 'v1',
  variables: { name: 'Alice', role: 'engineer' },
  onSuccess: vi.fn(),
};

describe('SaveSnapshotDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with name input and action buttons when open', () => {
    render(<SaveSnapshotDialog {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Save Snapshot' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows an error toast when trying to save with an empty name', async () => {
    render(<SaveSnapshotDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }));

    expect(toast.error).toHaveBeenCalledWith('Please enter a name for the snapshot');
    expect(actions.saveSnapshot).not.toHaveBeenCalled();
  });

  it('saves snapshot with correct payload and calls onSuccess', async () => {
    vi.mocked(actions.saveSnapshot).mockResolvedValue({ success: true });

    render(<SaveSnapshotDialog {...defaultProps} />);

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'My Snapshot' } });
    fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }));

    await waitFor(() => {
      expect(actions.saveSnapshot).toHaveBeenCalledWith({
        name: 'My Snapshot',
        prompt_version_id: 'v1',
        variables: { name: 'Alice', role: 'engineer' },
      });
      expect(toast.success).toHaveBeenCalledWith('Snapshot saved successfully');
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows an error toast when the save action fails', async () => {
    vi.mocked(actions.saveSnapshot).mockResolvedValue({
      success: false,
      error: 'Server error',
    });

    render(<SaveSnapshotDialog {...defaultProps} />);

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'My Snapshot' } });
    fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to save snapshot',
        expect.objectContaining({ description: 'Server error' })
      );
    });
  });

  it('closes the dialog when Cancel is clicked', () => {
    render(<SaveSnapshotDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits the form when Enter key is pressed in the name input', async () => {
    vi.mocked(actions.saveSnapshot).mockResolvedValue({ success: true });

    render(<SaveSnapshotDialog {...defaultProps} />);

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'Keyboard Snapshot' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(actions.saveSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Keyboard Snapshot' })
      );
    });
  });

  it('shows "Saving..." text on the button while save is in progress', async () => {
    let resolveAction: (value: any) => void;
    vi.mocked(actions.saveSnapshot).mockImplementation(
      () => new Promise((resolve) => { resolveAction = resolve; })
    );

    render(<SaveSnapshotDialog {...defaultProps} />);

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'In Progress' } });
    fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    resolveAction!({ success: true });

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });
});
