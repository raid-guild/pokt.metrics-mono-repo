import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
    globals: true,
    clearMocks: true,
  },
});
