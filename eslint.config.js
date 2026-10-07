import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const domainBanned = [
  '@/application/**',
  '@/infrastructure/**',
  '@/interfaces/**',
  'fastify',
  'pino',
  'zod',
  '@typesafe-ai/sdk',
];

const applicationBanned = [
  '@/infrastructure/**',
  '@/interfaces/**',
  'fastify',
  'pino',
  '@typesafe-ai/sdk',
];

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: domainBanned.map((group) => ({
            group: [group],
            message: 'Domain code stays free of outer layers and frameworks.',
          })),
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: applicationBanned.map((group) => ({
            group: [group],
            message: 'Application code depends on ports, not adapters.',
          })),
        },
      ],
    },
  },
);
