import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSnapshots } from './queries';

const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = {
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(),
  })),
}));

describe('getSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it('should fetch snapshots for a prompt version ordered by date descending', async () => {
    const mockData = [
      {
        id: 's1',
        name: 'Snapshot One',
        prompt_version_id: 'v1',
        variables: { name: 'World' },
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user_id: 'u1',
      },
    ];
    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const result = await getSnapshots('v1');

    expect(result).toEqual(mockData);
    expect(mockFrom).toHaveBeenCalledWith('prompt_snapshots');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('prompt_version_id', 'v1');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should return an empty array when the database query fails', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const result = await getSnapshots('v1');

    expect(result).toEqual([]);
  });

  it('should return an empty array when no snapshots exist', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await getSnapshots('v1');

    expect(result).toEqual([]);
  });
});
