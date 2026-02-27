import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicPrompt } from './get-public-prompt';

const mockSupabase = {
  from: vi.fn(),
};

const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createPublicClient: vi.fn(() => mockSupabase),
}));

describe('getPublicPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnThis();
    queryBuilder.eq.mockReturnThis();
  });

  it('returns PublicPrompt for a public prompt', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({
      data: {
        id: 'prompt-1',
        title: 'My Prompt',
        description: 'A description',
        prompt_versions: [
          { content: 'v1 content', version_number: 1 },
          { content: 'v2 content', version_number: 2 },
        ],
      },
      error: null,
    });

    const result = await getPublicPrompt('prompt-1');

    expect(result).toEqual({
      id: 'prompt-1',
      title: 'My Prompt',
      description: 'A description',
      latest_content: 'v2 content',
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('prompts');
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'prompt-1');
    expect(queryBuilder.eq).toHaveBeenCalledWith('is_public', true);
  });

  it('returns null when prompt is private (RLS blocks, maybeSingle returns null)', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getPublicPrompt('private-id');

    expect(result).toBeNull();
  });

  it('returns null when prompt does not exist', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Row not found' },
    });

    const result = await getPublicPrompt('nonexistent-id');

    expect(result).toBeNull();
  });

  it('picks the highest version_number as latest content', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({
      data: {
        id: 'p1',
        title: 'T',
        description: null,
        prompt_versions: [
          { content: 'old', version_number: 1 },
          { content: 'newest', version_number: 5 },
          { content: 'middle', version_number: 3 },
        ],
      },
      error: null,
    });

    const result = await getPublicPrompt('p1');

    expect(result?.latest_content).toBe('newest');
  });
});
