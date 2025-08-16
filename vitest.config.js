import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    timeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000
  },
  esbuild: {
    target: 'node18'
  }
});