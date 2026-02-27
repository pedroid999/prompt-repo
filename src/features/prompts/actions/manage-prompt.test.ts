import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  archivePrompt,
  deletePrompt,
  restorePrompt,
  togglePromptPublic,
  updatePromptMetadata,
} from './manage-prompt';

const queryBuilderFactory = () => ({
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockResolvedValue({ error: null }),
});

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: () => [],
    get: () => undefined,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('manage prompt actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockSupabase.from.mockImplementation(() => queryBuilderFactory());
  });

  it('archives a prompt', async () => {
    const result = await archivePrompt('prompt-1');

    expect(result).toEqual({ success: true });
    const query = mockSupabase.from.mock.results[0]?.value;
    expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
    expect(query.update).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('id', 'prompt-1');
    expect(query.is).toHaveBeenCalledWith('archived_at', null);
  });

  it('restores a prompt', async () => {
    const query = queryBuilderFactory();
    query.eq.mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue(query);

    const result = await restorePrompt('prompt-1');

    expect(result).toEqual({ success: true });
    expect(query.update).toHaveBeenCalledWith({ archived_at: null });
    expect(query.eq).toHaveBeenCalledWith('id', 'prompt-1');
  });

  it('deletes a prompt permanently', async () => {
    const query = queryBuilderFactory();
    query.eq.mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue(query);

    const result = await deletePrompt('prompt-1');

    expect(result).toEqual({ success: true });
    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('id', 'prompt-1');
  });

  it('updates prompt metadata', async () => {
    const query = queryBuilderFactory();
    query.eq.mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue(query);

    const result = await updatePromptMetadata('prompt-1', {
      title: 'New title',
      description: '  ',
    });

    expect(result).toEqual({ success: true });
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New title',
        description: null,
      }),
    );
  });

  it('returns unauthorized when no user is present', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await archivePrompt('prompt-1');

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  describe('togglePromptPublic', () => {
    it('enables sharing', async () => {
      const query = queryBuilderFactory();
      query.eq.mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue(query);

      const result = await togglePromptPublic('prompt-1', true);

      expect(result).toEqual({ success: true });
      expect(query.update).toHaveBeenCalledWith({ is_public: true });
      expect(query.eq).toHaveBeenCalledWith('id', 'prompt-1');
    });

    it('disables sharing', async () => {
      const query = queryBuilderFactory();
      query.eq.mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue(query);

      const result = await togglePromptPublic('prompt-1', false);

      expect(result).toEqual({ success: true });
      expect(query.update).toHaveBeenCalledWith({ is_public: false });
    });

    it('returns unauthorized when no user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await togglePromptPublic('prompt-1', true);

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns error on DB failure', async () => {
      const query = queryBuilderFactory();
      query.eq.mockResolvedValue({ error: { message: 'db error' } });
      mockSupabase.from.mockReturnValue(query);

      const result = await togglePromptPublic('prompt-1', true);

      expect(result).toEqual({ success: false, error: 'Failed to update sharing: db error' });
    });
  });

  it('validates metadata input', async () => {
    const result = await updatePromptMetadata('prompt-1', {
      title: '',
      description: '',
    });

    expect(result.success).toBe(false);
    expect((result as { error: string }).error).toContain('Title is required');
  });
});
