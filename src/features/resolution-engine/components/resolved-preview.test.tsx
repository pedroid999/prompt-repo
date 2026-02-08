import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResolvedPreview } from './resolved-preview';

describe('ResolvedPreview', () => {
  it('renders the content as-is when there are no variables', () => {
    const content = 'Just plain text.';
    render(<ResolvedPreview content={content} values={{}} />);
    expect(screen.getByText('Just plain text.')).toBeInTheDocument();
  });

  it('substitutes variables with provided values', () => {
    const content = 'Hello {{name}}!';
    const values = { name: 'World' };
    render(<ResolvedPreview content={content} values={values} />);
    expect(screen.getByText('Hello World!')).toBeInTheDocument();
  });

  it('keeps the variable placeholder if the value is missing', () => {
    const content = 'Hello {{name}}!';
    const values = {};
    render(<ResolvedPreview content={content} values={values} />);
    expect(screen.getByText('Hello {{name}}!')).toBeInTheDocument();
  });

  it('handles "0" as a valid value', () => {
    const content = 'Count: {{count}}';
    const values = { count: '0' };
    render(<ResolvedPreview content={content} values={values} />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('handles empty string as a valid value', () => {
    const content = '{{prefix}}Value';
    const values = { prefix: '' };
    render(<ResolvedPreview content={content} values={values} />);
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('handles multiple variables and partial matches', () => {
    const content = '{{greeting}} {{name}}, welcome to {{place}}.';
    const values = { greeting: 'Hi', place: 'Mars' };
    // name is missing
    render(<ResolvedPreview content={content} values={values} />);
    expect(screen.getByText('Hi {{name}}, welcome to Mars.')).toBeInTheDocument();
  });

  it('uses font-mono and whitespace-pre-wrap classes', () => {
    const content = 'Code';
    render(<ResolvedPreview content={content} values={{}} />);
    const element = screen.getByText('Code');
    expect(element).toHaveClass('font-mono');
    expect(element).toHaveClass('whitespace-pre-wrap');
  });
});
