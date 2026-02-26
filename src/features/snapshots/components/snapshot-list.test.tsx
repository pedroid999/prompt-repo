import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnapshotList } from './snapshot-list';
import { toast } from 'sonner';

// Mock queries
vi.mock('../queries', () => ({
  getSnapshots: vi.fn(),
}));

// Mock variable-parser (use real implementation for correctness)
vi.mock('@/lib/utils/variable-parser', () => ({
  resolvePrompt: vi.fn((content: string, variables: Record<string, string>) =>
    content.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => variables[key.trim()] ?? `{{${key}}}`)
  ),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import * as queries from '../queries';

const mockSnapshots = [
  {
    id: 's1',
    name: 'Marketing v1',
    prompt_version_id: 'v1',
    variables: { audience: 'developers', tone: 'friendly' },
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    user_id: 'u1',
  },
];

describe('SnapshotList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('shows loading state initially while fetching', () => {
    vi.mocked(queries.getSnapshots).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<SnapshotList promptVersionId="v1" promptContent="Hello {{audience}}" />);

    expect(screen.getByText('Loading snapshots...')).toBeInTheDocument();
  });

  it('shows empty state when no snapshots exist', async () => {
    vi.mocked(queries.getSnapshots).mockResolvedValue([]);

    render(<SnapshotList promptVersionId="v1" promptContent="Hello {{audience}}" />);

    await waitFor(() => {
      expect(screen.getByText('No snapshots saved for this version.')).toBeInTheDocument();
    });
  });

  it('renders snapshot cards with name and variables', async () => {
    vi.mocked(queries.getSnapshots).mockResolvedValue(mockSnapshots as any);

    render(<SnapshotList promptVersionId="v1" promptContent="Hello {{audience}}, be {{tone}}." />);

    await waitFor(() => {
      expect(screen.getByText('Marketing v1')).toBeInTheDocument();
      expect(screen.getByText(/audience: developers/)).toBeInTheDocument();
      expect(screen.getByText(/tone: friendly/)).toBeInTheDocument();
    });
  });

  it('resolves and copies prompt when Copy button is clicked', async () => {
    vi.mocked(queries.getSnapshots).mockResolvedValue(mockSnapshots as any);

    render(
      <SnapshotList
        promptVersionId="v1"
        promptContent="Hello {{audience}}, be {{tone}}."
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Marketing v1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Hello developers, be friendly.'
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Copied to clipboard',
        expect.objectContaining({ description: 'Snapshot "Marketing v1" resolved and copied.' })
      );
    });
  });

  it('shows "Apply to Form" button only when onSelect prop is provided', async () => {
    vi.mocked(queries.getSnapshots).mockResolvedValue(mockSnapshots as any);
    const onSelect = vi.fn();

    render(
      <SnapshotList
        promptVersionId="v1"
        promptContent="Hello {{audience}}"
        onSelect={onSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply to form/i })).toBeInTheDocument();
    });
  });

  it('hides "Apply to Form" button when no onSelect prop is provided', async () => {
    vi.mocked(queries.getSnapshots).mockResolvedValue(mockSnapshots as any);

    render(<SnapshotList promptVersionId="v1" promptContent="Hello {{audience}}" />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /apply to form/i })).not.toBeInTheDocument();
    });
  });

  it('calls onSelect with the snapshot when "Apply to Form" is clicked', async () => {
    vi.mocked(queries.getSnapshots).mockResolvedValue(mockSnapshots as any);
    const onSelect = vi.fn();

    render(
      <SnapshotList
        promptVersionId="v1"
        promptContent="Hello {{audience}}"
        onSelect={onSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply to form/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /apply to form/i }));

    expect(onSelect).toHaveBeenCalledWith(mockSnapshots[0]);
  });

  it('re-fetches snapshots when promptVersionId changes', async () => {
    vi.mocked(queries.getSnapshots).mockResolvedValue(mockSnapshots as any);

    const { rerender } = render(
      <SnapshotList promptVersionId="v1" promptContent="Hello {{audience}}" />
    );

    await waitFor(() => expect(queries.getSnapshots).toHaveBeenCalledWith('v1'));

    vi.mocked(queries.getSnapshots).mockResolvedValue([]);
    rerender(<SnapshotList promptVersionId="v2" promptContent="Hello {{audience}}" />);

    await waitFor(() => expect(queries.getSnapshots).toHaveBeenCalledWith('v2'));
  });
});
