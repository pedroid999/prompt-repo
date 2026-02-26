import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CollectionList } from './collection-list';
import { Collection } from '../types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn().mockReturnValue(null),
  })),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock create-collection-dialog
vi.mock('./create-collection-dialog', () => ({
  CreateCollectionDialog: () => <button>Create Collection</button>,
}));

// Mock edit-collection-dialog
vi.mock('./edit-collection-dialog', () => ({
  EditCollectionDialog: () => null,
}));

// Mock context-menu UI components
vi.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: any) => <div>{children}</div>,
  ContextMenuTrigger: ({ children }: any) => <div>{children}</div>,
  ContextMenuContent: ({ children }: any) => <div>{children}</div>,
  ContextMenuItem: ({ children }: any) => <div>{children}</div>,
}));

const mockCollections: any[] = [
  { id: 'c1', user_id: 'u1', name: 'Work', created_at: '', updated_at: '' },
  { id: 'c2', user_id: 'u1', name: 'Personal', created_at: '', updated_at: '' },
];

describe('CollectionList', () => {
  it('renders a list of collections', () => {
    render(<CollectionList collections={mockCollections} />);

    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByText('All Prompts')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('renders mobile version when onSelect is provided', () => {
    render(<CollectionList collections={mockCollections} onSelect={() => {}} />);

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.queryByText('Collections')).not.toBeInTheDocument();
  });
});
