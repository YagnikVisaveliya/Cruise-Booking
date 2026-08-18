import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.ts'],
    exclude: ['dist/**'],
    testTimeout: 15000
  }
});
