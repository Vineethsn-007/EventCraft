import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const config = {
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig `@/*` path alias so API route tests resolve imports.
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    // every test file gets a fresh module registry so rate-limiter /
    // client-memoization state never leaks between files
    isolate: true,
  },
};

export default config;
