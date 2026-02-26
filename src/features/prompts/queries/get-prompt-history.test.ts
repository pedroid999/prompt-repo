import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPromptHistory } from './get-prompt-history';

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

describe('getPromptHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it('should fetch prompt history ordered by version descending', async () => {
    const mockData = [
      { id: 'v2', prompt_id: 'p1', version_number: 2, content: 'Updated', version_note: 'v2', created_at: '' },
      { id: 'v1', prompt_id: 'p1', version_number: 1, content: 'Initial', version_note: 'v1', created_at: '' },
    ];
    mockOrder.mockResolvedValue({ data: mockData, error: null });

    const result = await getPromptHistory('p1');

    expect(result).toEqual(mockData);
    expect(mockFrom).toHaveBeenCalledWith('prompt_versions');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('prompt_id', 'p1');
    expect(mockOrder).toHaveBeenCalledWith('version_number', { ascending: false });
  });

  it('should throw an error when the database query fails', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Database connection failed' } });

    await expect(getPromptHistory('p1')).rejects.toThrow('Database connection failed');
  });

  it('should return an empty array when no versions exist', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await getPromptHistory('p1');

    expect(result).toEqual([]);
  });
});
