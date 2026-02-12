import { describe, it, expect, vi, beforeEach } from 'vitest';
import { savePrompt } from './save-prompt';

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
  cookies: vi.fn(() => ({
    getAll: vi.fn(),
  })),
}));

describe('savePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful chain for Supabase
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });
    
    // Default user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  it('should create a prompt and its first version successfully', async () => {
    // Setup prompts insert response
    const mockPromptId = 'prompt-123';
    mockSingle.mockResolvedValueOnce({
      data: { id: mockPromptId },
      error: null,
    });
    
    // Setup prompt_versions insert response
    mockSingle.mockResolvedValueOnce({
      data: { id: 'version-123' },
      error: null,
    });

    const input = {
      title: 'Test Prompt',
      content: 'Test Content',
      description: 'Test Desc',
      version_note: 'Initial',
    };

    const result = await savePrompt(input) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // Check prompts insert
    expect(mockFrom).toHaveBeenCalledWith('prompts');
    expect(mockInsert).toHaveBeenCalledWith({
      title: 'Test Prompt',
      description: 'Test Desc',
      user_id: 'user-123',
    });

    // Check prompt_versions insert
    expect(mockFrom).toHaveBeenCalledWith('prompt_versions');
    expect(mockInsert).toHaveBeenCalledWith({
      prompt_id: mockPromptId,
      version_number: 1,
      content: 'Test Content',
      version_note: 'Initial',
    });
  });

  it('should return error if authentication fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Auth error'),
    });

    const result = await savePrompt({ title: 'T', content: 'C' }) as any;

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return error if prompt creation fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB Error' },
    });

    const result = await savePrompt({ title: 'T', content: 'C' }) as any;

    expect(result.success).toBe(false);
    expect(result.error).toContain('DB Error');
  });
});
