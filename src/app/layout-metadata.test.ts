import { describe, it, expect, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Geist: vi.fn().mockReturnValue({ variable: 'geist-sans' }),
  Geist_Mono: vi.fn().mockReturnValue({ variable: 'geist-mono' }),
}));

import { viewport } from './layout';

describe('RootLayout Viewport', () => {
  it('should have correct viewport settings for mobile resilience', () => {
    expect(viewport).toEqual({
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    });
  });
});
