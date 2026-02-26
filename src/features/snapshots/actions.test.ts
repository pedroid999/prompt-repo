import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveSnapshot } from './actions';

// Mock dependencies
const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const mockSupabase = {
  from: mockFrom,
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(),
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('saveSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });
    
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  it('should save a snapshot successfully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'snapshot-123' },
      error: null,
    });

    const input = {
      name: 'Test Snapshot',
      prompt_version_id: '00000000-0000-0000-0000-000000000000',
      variables: { key: 'value' },
    };

    const result = await saveSnapshot(input);

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('prompt_snapshots');
    expect(mockInsert).toHaveBeenCalledWith({
      name: 'Test Snapshot',
      prompt_version_id: '00000000-0000-0000-0000-000000000000',
      variables: { key: 'value' },
      user_id: 'user-123',
    });
  });

  it('should return error if validation fails', async () => {
    const input = {
      name: '', // Invalid name
      prompt_version_id: 'invalid-uuid',
      variables: {},
    };

    const result = await saveSnapshot(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error if unauthorized', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await saveSnapshot({
      name: 'Test',
      prompt_version_id: '00000000-0000-0000-0000-000000000000',
      variables: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});
