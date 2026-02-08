import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResolutionForm } from './resolution-form';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ResolutionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders "No variables detected" and a copy button when content has no variables', () => {
    render(<ResolutionForm content="No variables here" />);
    expect(screen.getByText('No variables detected.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy resolved prompt/i })).toBeInTheDocument();
  });

  it('renders input fields for each variable found in content', () => {
    const content = 'Hello {{name}}, you are a {{role}}.';
    render(<ResolutionForm content={content} />);
    
    expect(screen.getByLabelText('name')).toBeInTheDocument();
    expect(screen.getByLabelText('role')).toBeInTheDocument();
  });

  it('calls onValuesChange when an input value changes', async () => {
    const onValuesChange = vi.fn();
    const content = 'Hello {{name}}!';
    render(<ResolutionForm content={content} onValuesChange={onValuesChange} />);
    
    const input = screen.getByLabelText('name');
    fireEvent.change(input, { target: { value: 'World' } });
    
    expect(onValuesChange).toHaveBeenCalledWith({ name: 'World' });
  });

  it('deduplicates variables and renders only one input for each', () => {
    const content = '{{name}} and {{name}} and {{role}}';
    render(<ResolutionForm content={content} />);
    
    // TextBox role matches Input components
    const nameInput = screen.getByLabelText('name');
    const roleInput = screen.getByLabelText('role');
    expect(nameInput).toBeInTheDocument();
    expect(roleInput).toBeInTheDocument();
  });

  it('focuses the first input automatically', async () => {
    const content = '{{one}} {{two}}';
    render(<ResolutionForm content={content} />);
    
    const firstInput = screen.getByLabelText('one');
    await waitFor(() => {
      expect(document.activeElement).toBe(firstInput);
    });
  });

  it('renders and updates the preview', async () => {
    const content = 'Hello {{name}}!';
    render(<ResolutionForm content={content} />);
    
    // Initial state: preview shows empty string for variable
    expect(screen.getByText('Hello !')).toBeInTheDocument();
    
    const input = screen.getByLabelText('name');
    fireEvent.change(input, { target: { value: 'World' } });
    
    // Updated state: preview shows resolved content
    await waitFor(() => {
      expect(screen.getByText('Hello World!')).toBeInTheDocument();
    });
  });

  it('copies the resolved prompt to clipboard when "Copy" button is clicked', async () => {
    const content = 'Hello {{name}}!';
    render(<ResolutionForm content={content} />);
    
    const input = screen.getByLabelText('name');
    fireEvent.change(input, { target: { value: 'World' } });
    
    const copyButton = screen.getByRole('button', { name: /copy resolved prompt/i });
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello World!');
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard', expect.any(Object));
    });
  });

  it('triggers copy on Cmd+Enter', async () => {
    const content = 'Hello {{name}}!';
    render(<ResolutionForm content={content} />);
    
    const input = screen.getByLabelText('name');
    fireEvent.change(input, { target: { value: 'Keyboard' } });
    
    fireEvent.keyDown(window, { key: 'Enter', metaKey: true });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello Keyboard!');
  });
});
