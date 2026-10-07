import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

const floor = {
  lines: 90,
  functions: 90,
  branches: 90,
  statements: 90,
};

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${path.resolve(root, 'src')}/` },
      { find: /^@tests\//, replacement: `${path.resolve(root, 'tests')}/` },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/interfaces/http/server.ts'],
      thresholds: {
        'src/domain/**': floor,
        'src/domain/policy/**': floor,
        'src/application/**': {
          lines: 85,
          functions: 85,
          branches: 85,
          statements: 85,
        },
      },
    },
  },
});
