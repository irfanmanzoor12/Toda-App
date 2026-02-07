/**
 * Vitest setup file for frontend component tests.
 * Configures jsdom environment and testing utilities.
 */

import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/todos',
  useSearchParams: () => new URLSearchParams(),
}));
