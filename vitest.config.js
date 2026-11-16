import { defineConfig } from 'vitest/config';

// Unit tests cover pure modules (src/lib, src/api); no browser or React plugin needed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
